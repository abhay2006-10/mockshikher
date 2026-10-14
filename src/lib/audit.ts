import prisma from '@/lib/prisma';

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  author: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
}

/**
 * Records an admin action into the PostgreSQL audit_logs table.
 */
export async function recordAuditLog(
  action: string,
  details: string,
  author: string = 'Admin',
  status: 'SUCCESS' | 'ERROR' = 'SUCCESS'
): Promise<AuditLogEntry> {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action,
        details,
        author,
        status,
      },
    });
    return {
      id: log.id,
      action: log.action,
      details: log.details,
      author: log.author,
      timestamp: log.createdAt.toISOString(),
      status: log.status as 'SUCCESS' | 'ERROR',
    };
  } catch (err) {
    console.warn('Failed to persist audit log to PostgreSQL audit_logs table:', err);
    return {
      id: `fallback-${Date.now()}`,
      action,
      details,
      author,
      timestamp: new Date().toISOString(),
      status,
    };
  }
}

/**
 * Retrieves the latest audit logs from PostgreSQL audit_logs table.
 */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      details: l.details,
      author: l.author,
      timestamp: l.createdAt.toISOString(),
      status: (l.status === 'ERROR' ? 'ERROR' : 'SUCCESS') as 'SUCCESS' | 'ERROR',
    }));
  } catch (err) {
    console.warn('Failed to query audit logs from database:', err);
    return [];
  }
}
