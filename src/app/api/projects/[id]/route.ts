import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true, phone: true } },
        charter: true,
        scope: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, division: true, role: true } },
          },
        },
        phases: {
          orderBy: { phaseNumber: "asc" },
          include: {
            gates: {
              include: {
                approvals: {
                  include: { approver: { select: { id: true, name: true, email: true } } },
                },
              },
            },
          },
        },
        milestones: { orderBy: { targetDate: "asc" } },
        budgetPlan: {
          include: {
            items: true,
            expenses: { orderBy: { expenseDate: "desc" } },
          },
        },
        _count: {
          select: {
            tasks: true,
            risks: true,
            documents: true,
            changeRequests: true,
            meetings: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
    }

    // Role check for MEMBER / STAKEHOLDER
    if (["MEMBER", "STAKEHOLDER"].includes(user.role.name)) {
      const isMember = project.members.some((m) => m.userId === user.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Anda tidak memiliki akses ke proyek ini" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat detail proyek" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(user.role.name, ["OWNER", "PM", "ADMIN"])) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
        priority: body.priority,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        budget: body.budget !== undefined ? Number(body.budget) : undefined,
      },
    });

    await logAudit({
      userId: user.id,
      projectId: params.id,
      action: "PROJECT_UPDATE",
      entityType: "Project",
      entityId: params.id,
      details: body,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui proyek" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(user.role.name, ["ADMIN", "OWNER"])) {
      return NextResponse.json(
        { error: "Hanya Admin atau Owner yang dapat mengarsipkan/menghapus proyek" },
        { status: 403 }
      );
    }

    // Soft-archive by setting status to Cancelled
    const archived = await prisma.project.update({
      where: { id: params.id },
      data: { status: "Cancelled" },
    });

    await logAudit({
      userId: user.id,
      projectId: params.id,
      action: "PROJECT_ARCHIVE",
      entityType: "Project",
      entityId: params.id,
      details: "Status proyek diubah menjadi Cancelled",
    });

    return NextResponse.json({ success: true, message: "Proyek berhasil diarsipkan" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Gagal mengarsipkan proyek" }, { status: 500 });
  }
}

