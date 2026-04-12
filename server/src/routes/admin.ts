import { Router, Request, Response } from "express";
import { Role, SubjectType, AuditAction, AuditSeverity, Quarter } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";
import { addSseClient, removeSseClient, addSettingsSseClient, removeSettingsSseClient, broadcastSettingsUpdate } from "../lib/sseManager";

const router = Router();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype) || file.mimetype === "image/svg+xml";
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Access denied. Admin only." });
    return;
  }
  next();
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

// Get admin dashboard stats
router.get("/dashboard", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user counts by role
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const totalUsers = userCounts.reduce((sum, item) => sum + item._count, 0);
    const totalTeachers = userCounts.find((u) => u.role === "TEACHER")?._count || 0;
    const totalAdmins = userCounts.find((u) => u.role === "ADMIN")?._count || 0;
    const totalRegistrars = userCounts.find((u) => u.role === "REGISTRAR")?._count || 0;

    // Get student count
    const totalStudents = await prisma.student.count();

    // Get today's login count from audit logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = await prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN,
        createdAt: { gte: today },
      },
    });

    // Get recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // Get active sessions (logins in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = await prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN,
        createdAt: { gte: oneHourAgo },
      },
    });

    // Get system settings
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "main" },
    });

    res.json({
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalAdmins,
        totalRegistrars,
        activeUsers,
        todayLogins,
      },
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        action: log.action.toLowerCase(),
        user: log.userName,
        userRole: log.userRole,
        target: log.target,
        targetType: log.targetType,
        details: log.details,
        ipAddress: log.ipAddress,
        severity: log.severity.toLowerCase(),
        timestamp: log.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: log.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
      systemStatus: {
        database: "healthy",
        lastBackup: "N/A",
        uptime: "99.9%",
      },
      settings: settings
        ? {
            schoolName: settings.schoolName,
            currentSchoolYear: settings.currentSchoolYear,
            currentQuarter: settings.currentQuarter,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// Get all users with filtering
router.get("/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, status } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            employeeId: true,
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add status (we'll assume all users are active for now - could add isActive field later)
    const usersWithStatus = users.map((user) => ({
      ...user,
      status: "Active", // In production, this would come from a field in the database
      lastActive: user.updatedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Create new user
router.post("/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, role, firstName, lastName, email, employeeId, specialization } = req.body;

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role as Role,
        firstName,
        lastName,
        email,
      },
    });

    // If teacher, create teacher record
    if (role === "TEACHER" && employeeId) {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          specialization,
        },
      });
    }

    // Create audit log
    await createAuditLog(
      AuditAction.CREATE,
      req.user!,
      "User Account",
      "User",
      `Created new ${role.toLowerCase()} account: ${firstName} ${lastName}`,
      req.ip,
      AuditSeverity.INFO,
      user.id
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Update user
router.put("/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { username, password, role, firstName, lastName, email, employeeId, specialization } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if new username conflicts with another user
    if (username !== existingUser.username) {
      const conflict = await prisma.user.findUnique({
        where: { username },
      });
      if (conflict) {
        res.status(400).json({ message: "Username already taken" });
        return;
      }
    }

    // Prepare update data
    const updateData: any = {
      username,
      role: role as Role,
      firstName,
      lastName,
      email,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle teacher record
    if (role === "TEACHER") {
      if (existingUser.teacher) {
        // Update existing teacher record
        await prisma.teacher.update({
          where: { userId: id },
          data: { employeeId, specialization },
        });
      } else if (employeeId) {
        // Create new teacher record
        await prisma.teacher.create({
          data: {
            userId: id,
            employeeId,
            specialization,
          },
        });
      }
    } else if (existingUser.teacher) {
      // User is no longer a teacher, delete teacher record
      await prisma.teacher.delete({
        where: { userId: id },
      });
    }

    // Create audit log
    await createAuditLog(
      AuditAction.UPDATE,
      req.user!,
      "User Account",
      "User",
      `Updated user account: ${firstName} ${lastName}`,
      req.ip,
      AuditSeverity.INFO,
      user.id
    );

    res.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user
router.delete("/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Don't allow deleting yourself
    if (user.id === req.user!.id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }

    // Delete user (cascade will handle teacher record)
    await prisma.user.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog(
      AuditAction.DELETE,
      req.user!,
      "User Account",
      "User",
      `Deleted user account: ${user.firstName} ${user.lastName} (${user.username})`,
      req.ip,
      AuditSeverity.WARNING,
      id
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

// Get audit logs with filtering
router.get("/logs", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, severity, search, limit = "50", offset = "0" } = req.query;

    const where: any = {};

    if (action && action !== "all") {
      where.action = (action as string).toUpperCase() as AuditAction;
    }

    if (severity && severity !== "all") {
      where.severity = (severity as string).toUpperCase() as AuditSeverity;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search as string, mode: "insensitive" } },
        { target: { contains: search as string, mode: "insensitive" } },
        { details: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get counts by action type
    const actionCounts = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
    });

    const severityCounts = await prisma.auditLog.groupBy({
      by: ["severity"],
      _count: true,
    });

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action.toLowerCase(),
        user: log.userName,
        userRole: log.userRole,
        target: log.target,
        targetType: log.targetType,
        details: log.details,
        ipAddress: log.ipAddress,
        severity: log.severity.toLowerCase(),
        timestamp: log.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: log.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        createdAt: log.createdAt,
      })),
      total,
      counts: {
        total,
        creates: actionCounts.find((c) => c.action === "CREATE")?._count || 0,
        updates: actionCounts.find((c) => c.action === "UPDATE")?._count || 0,
        deletes: actionCounts.find((c) => c.action === "DELETE")?._count || 0,
        logins:
          (actionCounts.find((c) => c.action === "LOGIN")?._count || 0) +
          (actionCounts.find((c) => c.action === "LOGOUT")?._count || 0),
        critical: severityCounts.find((c) => c.severity === "CRITICAL")?._count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Real-time SSE stream for audit logs
router.get("/logs/stream", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send a heartbeat comment every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  addSseClient(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(res);
  });
});

// Export audit logs (CSV)
router.get("/logs/export", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000 // Limit export to last 1000 entries
    });

    const csv = [
      "ID,Action,User,Role,Target,Details,IP Address,Severity,Date/Time",
      ...logs.map(
        (log) =>
          `"${log.id}","${log.action}","${log.userName}","${log.userRole}","${log.target}","${log.details.replace(/"/g, '""')}","${log.ipAddress || ""}","${log.severity}","${log.createdAt.toISOString()}"`
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({ message: "Failed to export audit logs" });
  }
});

// ============================================
// SYSTEM SETTINGS ENDPOINTS
// ============================================

// Get system settings
router.get("/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "main" },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: "main" },
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update system settings
router.put("/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      schoolName,
      schoolId,
      division,
      region,
      address,
      contactNumber,
      email,
      currentSchoolYear,
      currentQuarter,
      primaryColor,
      secondaryColor,
      accentColor,
      sessionTimeout,
      maxLoginAttempts,
      passwordMinLength,
      requireSpecialChar,
      // Academic calendar dates
      q1StartDate,
      q1EndDate,
      q2StartDate,
      q2EndDate,
      q3StartDate,
      q3EndDate,
      q4StartDate,
      q4EndDate,
      autoAdvanceQuarter,
    } = req.body;

    const settings = await prisma.systemSettings.upsert({
      where: { id: "main" },
      update: {
        schoolName,
        schoolId,
        division,
        region,
        address,
        contactNumber,
        email,
        currentSchoolYear,
        currentQuarter: currentQuarter as Quarter,
        primaryColor,
        secondaryColor,
        accentColor,
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        requireSpecialChar,
        q1StartDate: q1StartDate ? new Date(q1StartDate) : undefined,
        q1EndDate: q1EndDate ? new Date(q1EndDate) : undefined,
        q2StartDate: q2StartDate ? new Date(q2StartDate) : undefined,
        q2EndDate: q2EndDate ? new Date(q2EndDate) : undefined,
        q3StartDate: q3StartDate ? new Date(q3StartDate) : undefined,
        q3EndDate: q3EndDate ? new Date(q3EndDate) : undefined,
        q4StartDate: q4StartDate ? new Date(q4StartDate) : undefined,
        q4EndDate: q4EndDate ? new Date(q4EndDate) : undefined,
        autoAdvanceQuarter,
      },
      create: {
        id: "main",
        schoolName,
        schoolId,
        division,
        region,
        address,
        contactNumber,
        email,
        currentSchoolYear,
        currentQuarter: currentQuarter as Quarter,
        primaryColor,
        secondaryColor,
        accentColor,
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        requireSpecialChar,
        q1StartDate: q1StartDate ? new Date(q1StartDate) : undefined,
        q1EndDate: q1EndDate ? new Date(q1EndDate) : undefined,
        q2StartDate: q2StartDate ? new Date(q2StartDate) : undefined,
        q2EndDate: q2EndDate ? new Date(q2EndDate) : undefined,
        q3StartDate: q3StartDate ? new Date(q3StartDate) : undefined,
        q3EndDate: q3EndDate ? new Date(q3EndDate) : undefined,
        q4StartDate: q4StartDate ? new Date(q4StartDate) : undefined,
        q4EndDate: q4EndDate ? new Date(q4EndDate) : undefined,
        autoAdvanceQuarter,
      },
    });

    // Create audit log
    await createAuditLog(
      AuditAction.CONFIG,
      req.user!,
      "System Settings",
      "Config",
      "Updated system settings",
      req.ip,
      AuditSeverity.CRITICAL
    );

    // Broadcast settings update to all connected clients
    broadcastSettingsUpdate(settings);

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// Upload logo
router.post(
  "/settings/logo",
  authenticateToken,
  requireAdmin,
  upload.single("logo"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const logoUrl = `/uploads/${req.file.filename}`;

      const settings = await prisma.systemSettings.update({
        where: { id: "main" },
        data: { logoUrl },
      });

      // Create audit log
      await createAuditLog(
        AuditAction.UPDATE,
        req.user!,
        "School Logo",
        "Config",
        "Uploaded new school logo",
        req.ip,
        AuditSeverity.INFO
      );

      // Broadcast settings update for realtime sync
      broadcastSettingsUpdate(settings);

      res.json({ message: "Logo uploaded successfully", logoUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  }
);

// Update color scheme
router.put("/settings/colors", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { primaryColor, secondaryColor, accentColor } = req.body;

    const settings = await prisma.systemSettings.update({
      where: { id: "main" },
      data: {
        primaryColor,
        secondaryColor,
        accentColor,
      },
    });

    // Create audit log
    await createAuditLog(
      AuditAction.CONFIG,
      req.user!,
      "Color Scheme",
      "Config",
      `Updated color scheme: Primary ${primaryColor}, Secondary ${secondaryColor}, Accent ${accentColor}`,
      req.ip,
      AuditSeverity.INFO
    );

    // Broadcast settings update for realtime sync
    broadcastSettingsUpdate(settings);

    res.json({
      message: "Color scheme updated successfully",
      colors: {
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
      },
    });
  } catch (error) {
    console.error("Error updating color scheme:", error);
    res.status(500).json({ message: "Failed to update color scheme" });
  }
});

// Real-time SSE stream for settings updates
router.get("/settings/stream", authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send a heartbeat comment every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  addSettingsSseClient(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSettingsSseClient(res);
  });
});

// ============================================
// GRADING CONFIG ENDPOINTS
// ============================================

// Get grading configurations
router.get("/grading-config", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const configs = await prisma.gradingConfig.findMany({
      orderBy: { subjectType: "asc" },
    });

    // If no configs exist, create defaults
    if (configs.length === 0) {
      const defaultConfigs = [
        { subjectType: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
        { subjectType: SubjectType.PE_HEALTH, ww: 20, pt: 60, qa: 20 },
        { subjectType: SubjectType.MAPEH, ww: 20, pt: 60, qa: 20 },
        { subjectType: SubjectType.TLE, ww: 20, pt: 60, qa: 20 },
      ];

      for (const config of defaultConfigs) {
        await prisma.gradingConfig.create({
          data: {
            subjectType: config.subjectType,
            writtenWorkWeight: config.ww,
            performanceTaskWeight: config.pt,
            quarterlyAssessWeight: config.qa,
            isDepEdDefault: true,
          },
        });
      }

      const newConfigs = await prisma.gradingConfig.findMany({
        orderBy: { subjectType: "asc" },
      });
      res.json({ configs: newConfigs });
      return;
    }

    res.json({ configs });
  } catch (error) {
    console.error("Error fetching grading configs:", error);
    res.status(500).json({ message: "Failed to fetch grading configurations" });
  }
});

// Update grading configuration
router.put("/grading-config/:subjectType", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectType } = req.params;
    const { writtenWorkWeight, performanceTaskWeight, quarterlyAssessWeight } = req.body;

    // Validate weights sum to 100
    const total = writtenWorkWeight + performanceTaskWeight + quarterlyAssessWeight;
    if (total !== 100) {
      res.status(400).json({ message: `Weights must sum to 100%. Current sum: ${total}%` });
      return;
    }

    const config = await prisma.gradingConfig.upsert({
      where: { subjectType: subjectType as SubjectType },
      update: {
        writtenWorkWeight,
        performanceTaskWeight,
        quarterlyAssessWeight,
        isDepEdDefault: false,
      },
      create: {
        subjectType: subjectType as SubjectType,
        writtenWorkWeight,
        performanceTaskWeight,
        quarterlyAssessWeight,
        isDepEdDefault: false,
      },
    });

    // Create audit log
    await createAuditLog(
      AuditAction.CONFIG,
      req.user!,
      "Grading Weights",
      "Config",
      `Updated ${subjectType} grading weights: WW ${writtenWorkWeight}%, PT ${performanceTaskWeight}%, QA ${quarterlyAssessWeight}%`,
      req.ip,
      AuditSeverity.CRITICAL
    );

    res.json({ message: "Grading configuration updated successfully", config });
  } catch (error) {
    console.error("Error updating grading config:", error);
    res.status(500).json({ message: "Failed to update grading configuration" });
  }
});

// Reset grading configuration to DepEd defaults
router.post("/grading-config/reset", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // DepEd default weights
    const defaults = [
      { subjectType: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
      { subjectType: SubjectType.PE_HEALTH, ww: 20, pt: 60, qa: 20 },
      { subjectType: SubjectType.MAPEH, ww: 20, pt: 60, qa: 20 },
      { subjectType: SubjectType.TLE, ww: 20, pt: 60, qa: 20 },
    ];

    for (const config of defaults) {
      await prisma.gradingConfig.upsert({
        where: { subjectType: config.subjectType },
        update: {
          writtenWorkWeight: config.ww,
          performanceTaskWeight: config.pt,
          quarterlyAssessWeight: config.qa,
          isDepEdDefault: true,
        },
        create: {
          subjectType: config.subjectType,
          writtenWorkWeight: config.ww,
          performanceTaskWeight: config.pt,
          quarterlyAssessWeight: config.qa,
          isDepEdDefault: true,
        },
      });
    }

    // Create audit log
    await createAuditLog(
      AuditAction.CONFIG,
      req.user!,
      "Grading Weights",
      "Config",
      "Reset all grading weights to DepEd defaults",
      req.ip,
      AuditSeverity.CRITICAL
    );

    const configs = await prisma.gradingConfig.findMany({
      orderBy: { subjectType: "asc" },
    });

    res.json({ message: "Grading configurations reset to defaults", configs });
  } catch (error) {
    console.error("Error resetting grading configs:", error);
    res.status(500).json({ message: "Failed to reset grading configurations" });
  }
});

export default router;
