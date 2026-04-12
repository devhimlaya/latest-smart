import { AuditAction, AuditSeverity } from "@prisma/client";
import { prisma } from "./prisma";
import { broadcastLog } from "./sseManager";

export async function createAuditLog(
  action: AuditAction,
  user: { id: string; firstName?: string | null; lastName?: string | null; role: string },
  target: string,
  targetType: string,
  details: string,
  ipAddress?: string,
  severity: AuditSeverity = AuditSeverity.INFO,
  targetId?: string,
  metadata?: object
) {
  const log = await prisma.auditLog.create({
    data: {
      action,
      userId: user.id,
      userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.role,
      userRole: user.role,
      target,
      targetType,
      targetId,
      details,
      ipAddress,
      severity,
      metadata: metadata || undefined,
    },
  });

  // Push to all connected SSE admin clients
  broadcastLog({
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
  });
}
