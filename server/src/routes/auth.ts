import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuditAction, AuditSeverity } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { createAuditLog } from "../lib/audit";

const router = Router();

// Login route
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      // Log failed login attempt (unknown user)
      await createAuditLog(
        AuditAction.LOGIN,
        { id: "unknown", firstName: username, lastName: null, role: "UNKNOWN" },
        `Login attempt: ${username}`,
        "Auth",
        `Failed login attempt for username: ${username} — user not found`,
        ipAddress,
        AuditSeverity.WARNING
      );
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Log failed login (wrong password)
      await createAuditLog(
        AuditAction.LOGIN,
        { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
        `Login attempt: ${username}`,
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
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    // Log successful login
    await createAuditLog(
      AuditAction.LOGIN,
      { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
      `Login: ${user.username}`,
      "Auth",
      `${user.firstName || ""} ${user.lastName || ""} (${user.role}) logged in successfully`,
      ipAddress,
      AuditSeverity.INFO
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
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
