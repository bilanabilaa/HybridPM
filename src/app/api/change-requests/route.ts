import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createCRSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  reason: z.string().min(5, "Alasan minimal 5 karakter"),
  costImpact: z.number().default(0),
  scheduleImpactDays: z.number().int().default(0),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    // Members only see their own CRs
    if (user.role.name === "MEMBER") {
      whereClause.requesterId = user.id;
    }

    const changeRequests = await prisma.changeRequest.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, projectCode: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ changeRequests });
  } catch (error) {
    console.error("GET /api/change-requests error:", error);
    return NextResponse.json({ error: "Gagal memuat change request" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["PM", "MEMBER", "ADMIN"].includes(user.role.name)) {
      return NextResponse.json(
        { error: "Forbidden: Hanya PM, Anggota Tim, atau Admin yang dapat mengajukan CR" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createCRSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;

    // Generate CR code
    const count = await prisma.changeRequest.count({ where: { projectId: data.projectId } });
    const crCode = `CR-${String(count + 1).padStart(3, "0")}`;

    const changeRequest = await prisma.changeRequest.create({
      data: {
        crCode,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        reason: data.reason,
        costImpact: data.costImpact,
        scheduleImpactDays: data.scheduleImpactDays,
        status: "Pending",
        requesterId: user.id,
      },
      include: {
        project: { select: { id: true, projectCode: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user.id,
      projectId: data.projectId,
      action: "CR_CREATE",
      entityType: "ChangeRequest",
      entityId: changeRequest.id,
      details: { crCode, title: data.title },
    });

    return NextResponse.json({ success: true, changeRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/change-requests error:", error);
    return NextResponse.json({ error: "Gagal membuat change request" }, { status: 500 });
  }
}
