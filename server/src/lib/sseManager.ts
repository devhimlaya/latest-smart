import { Response } from "express";

// Set of all connected SSE admin clients for audit logs
const auditClients = new Set<Response>();

// Set of all connected SSE clients for settings updates
const settingsClients = new Set<Response>();

export function addSseClient(res: Response) {
  auditClients.add(res);
}

export function removeSseClient(res: Response) {
  auditClients.delete(res);
}

export function addSettingsSseClient(res: Response) {
  settingsClients.add(res);
}

export function removeSettingsSseClient(res: Response) {
  settingsClients.delete(res);
}

export function broadcastLog(log: object) {
  const data = `data: ${JSON.stringify(log)}\n\n`;
  for (const client of auditClients) {
    try {
      client.write(data);
    } catch {
      auditClients.delete(client);
    }
  }
}

export function broadcastSettingsUpdate(settings: object) {
  const data = `data: ${JSON.stringify(settings)}\n\n`;
  for (const client of settingsClients) {
    try {
      client.write(data);
    } catch {
      settingsClients.delete(client);
    }
  }
}
