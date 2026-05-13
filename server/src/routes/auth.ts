import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuditAction, AuditSeverity } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { createAuditLog } from "../lib/audit";
import { validateEnrollProTeacherCredentials } from "../lib/enrollproClient";
import { syncTeacherOnLogin } from "../lib/teacherSync";

const router = Router();

// Login route
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    let user = null;

    // If the identifier looks like an employee ID (no @ sign), try teacher lookup first,
    // then username (admin / registrar use their employee ID as username)
    if (!email.includes('@')) {
      const teacher = await prisma.teacher.findUnique({
        where: { employeeId: email },
        include: { user: true },
      });
      user = teacher?.user ?? null;

      if (!user) {
        user = await prisma.user.findUnique({
          where: { username: email },
        });
      }
    }

    // Fall back to email lookup
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email },
      });
    }

    if (!user) {
      // Log failed login attempt (unknown user)
      await createAuditLog(
        AuditAction.LOGIN,
        { id: "unknown", firstName: email, lastName: null, role: "UNKNOWN" },
        `Login attempt: ${email}`,
        "Auth",
        `Failed login attempt for email: ${email} — user not found`,
        ipAddress,
        AuditSeverity.WARNING
      );
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Verify password — for TEACHER accounts, first try EnrollPro credentials
    let isValidPassword = false;

    if (user.role === 'TEACHER') {
      // Use the identifier that was provided (employeeId or email)
      const loginIdentifier = !email.includes('@') ? email : user.email;
      try {
        const epResult = await validateEnrollProTeacherCredentials(loginIdentifier, password);
        if (epResult !== null) {
          // EnrollPro accepted credentials
          isValidPassword = true;
        } else {
          // EnrollPro explicitly rejected (wrong password / account not found)
          isValidPassword = false;
        }
      } catch (epErr) {
        // EnrollPro unreachable — fall back to SMART's own stored password
        console.warn('[Auth] EnrollPro unreachable, falling back to local bcrypt:', (epErr as Error).message);
        isValidPassword = await bcrypt.compare(password, user.password);
      }
    } else {
      isValidPassword = await bcrypt.compare(password, user.password);
    }

    if (!isValidPassword) {
      // Log failed login (wrong password)
      await createAuditLog(
        AuditAction.LOGIN,
        { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
        `Login attempt: ${email}`,
        "Auth",
        `Failed login attempt for ${user.firstName || ""} ${user.lastName || ""} (${user.role}) — incorrect password`,
        ipAddress,
        AuditSeverity.WARNING
      );
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    // Log successful login
    await createAuditLog(
      AuditAction.LOGIN,
      { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
        `Login: ${user.email}`,
      "Auth",
      `${user.firstName || ""} ${user.lastName || ""} (${user.role}) logged in successfully`,
      ipAddress,
      AuditSeverity.INFO
    );

    // For teachers: fire-and-forget real-time sync from EnrollPro + Atlas
    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (teacher?.employeeId && user.email) {
        syncTeacherOnLogin(teacher.id, teacher.employeeId, user.email).catch((e: Error) => {
          console.error('[Auth] Teacher sync error:', e.message);
        });
      }
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user (protected route)
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
router.post("/logout", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    if (req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, firstName: true, lastName: true, role: true },
      });
      if (user) {
        await createAuditLog(
          AuditAction.LOGOUT,
          { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
          `Logout: ${user.username}`,
          "Auth",
          `${user.firstName || ""} ${user.lastName || ""} (${user.role}) logged out`,
          ipAddress,
          AuditSeverity.INFO
        );
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ message: "Logged out successfully" });
  }
});

export default router;
