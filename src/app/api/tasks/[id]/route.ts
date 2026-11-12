import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { WIP_LIMITS } from "@/lib/kanban-config";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, division: true } },
        creator: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        histories: { orderBy: { changedAt: "desc" } },
        project: { select: { id: true, projectCode: true, name: true } },
      },
    });

    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat tugas" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

    const targetStatus = body.status;

    // If status is changing, enforce Kanban rules!
    if (targetStatus && targetStatus !== task.status) {
      // 1. WIP Limit validation
      const limit = WIP_LIMITS[targetStatus];
      if (limit !== null && limit !== undefined) {
        const currentCount = await prisma.task.count({
          where: {
            projectId: task.projectId,
            status: targetStatus,
            id: { not: task.id },
          },
        });
        if (currentCount >= limit) {
          return NextResponse.json(
            {
              error: `Batas WIP kolom "${targetStatus}" tercapai! Maksimal ${limit} kartu diizinkan pada kolom ini. Selesaikan atau pindahkan kartu lain terlebih dahulu.`,
            },
            { status: 400 }
          );
        }
      }

      // 2. Quality Gate check for "Done"
      // User must verify code review, testing, and user demo
      if (targetStatus === "Done") {
        const isReviewed = body.isReviewed ?? task.isReviewed;
        const isTested = body.isTested ?? task.isTested;
        const isDemoed = body.isDemoed ?? task.isDemoed;

        if (!isReviewed || !isTested || !isDemoed) {
          return NextResponse.json(
            {
              error:
                "Kartu hanya dapat dipindahkan ke 'Done' setelah memenuhi 3 kriteria kualitas: (1) Code Review lulus, (2) Pengujian/Testing lulus, dan (3) Telah didemokan ke perwakilan pengguna.",
            },
            { status: 400 }
          );
        }
      }

      // Record status transition in TaskStatusHistory
      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: task.status,
          toStatus: targetStatus,
          changedBy: user.name,
        },
      });

      // Update timestamps
      let startDate = task.startDate;
      let completedAt = task.completedAt;

      if (!startDate && targetStatus !== "Backlog") {
        startDate = new Date();
      }
      if (targetStatus === "Done") {
        completedAt = new Date();
      } else if (task.status === "Done" && targetStatus !== "Done") {
        completedAt = null;
      }

      body.startDate = startDate;
      body.completedAt = completedAt;
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        status: body.status !== undefined ? body.status : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        labels: body.labels !== undefined ? body.labels : undefined,
        assigneeId: body.assigneeId !== undefined ? body.assigneeId : undefined,
        estimateDays: body.estimateDays !== undefined ? Number(body.estimateDays) : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        startDate: body.startDate !== undefined ? body.startDate : undefined,
        completedAt: body.completedAt !== undefined ? body.completedAt : undefined,
        isReviewed: body.isReviewed !== undefined ? body.isReviewed : undefined,
        isTested: body.isTested !== undefined ? body.isTested : undefined,
        isDemoed: body.isDemoed !== undefined ? body.isDemoed : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: user.id,
      projectId: task.projectId,
      action: "TASK_UPDATE",
      entityType: "Task",
      entityId: task.id,
      details: {
        taskCode: task.taskCode,
        fromStatus: task.status,
        toStatus: targetStatus || task.status,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status tugas" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

    await prisma.task.delete({ where: { id: params.id } });

    await logAudit({
      userId: user.id,
      projectId: task.projectId,
      action: "TASK_DELETE",
      entityType: "Task",
      entityId: params.id,
      details: { taskCode: task.taskCode, title: task.title },
    });

    return NextResponse.json({ success: true, message: "Tugas berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}

