import prisma from "./prisma";

export async function logAudit({
  userId,
  projectId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string | null;
  projectId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}) {
  try {
    const detailsString: string | null =
      typeof details === "object" && details !== null
        ? JSON.stringify(details)
        : (details as string | null) || null;

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        projectId: projectId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: detailsString,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}

