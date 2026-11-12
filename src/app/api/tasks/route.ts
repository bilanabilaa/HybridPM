import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { WIP_LIMITS } from "@/lib/kanban-config";

const createTaskSchema = z.object({
  projectId: z.string().min(1, "Proyek wajib dipilih"),
  title: z.string().min(3, "Judul tugas minimal 3 karakter"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  labels: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  phaseId: z.string().nullable().optional(),
  estimateDays: z.number().positive().default(1),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["Backlog", "Analisis", "Develop", "Review", "Test", "Done"]).default("Backlog"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const myTasks = searchParams.get("myTasks");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (myTasks === "true") whereClause.assigneeId = user.id;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, name: true, email: true, division: true } },
        creator: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        histories: { orderBy: { changedAt: "desc" } },
        project: { select: { id: true, projectCode: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count WIP per status
    const wipCounts: Record<string, number> = {
      Backlog: 0,
      Analisis: 0,
      Develop: 0,
      Review: 0,
      Test: 0,
      Done: 0,
    };

    tasks.forEach((t) => {
      if (wipCounts[t.status] !== undefined) {
        wipCounts[t.status]++;
      }
    });

    return NextResponse.json({ tasks, wipCounts, wipLimits: WIP_LIMITS });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Gagal memuat tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;

    // Check WIP limit if adding directly to restricted column
    const limit = WIP_LIMITS[data.status];
    if (limit !== null && limit !== undefined) {
      const currentCount = await prisma.task.count({
        where: { projectId: data.projectId, status: data.status },
      });
      if (currentCount >= limit) {
        return NextResponse.json(
          {
            error: `Batas WIP kolom ${data.status} terlampaui! Maksimal ${limit} tugas aktif diperbolehkan.`,
          },
          { status: 400 }
        );
      }
    }

    // Generate Task Code
    const count = await prisma.task.count({ where: { projectId: data.projectId } });
    const taskCode = `TSK-${String(count + 1).padStart(3, "0")}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        projectId: data.projectId,
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        labels: data.labels || "",
        assigneeId: data.assigneeId || null,
        creatorId: user.id,
        phaseId: data.phaseId || null,
        estimateDays: data.estimateDays,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status,
        startDate: data.status !== "Backlog" ? new Date() : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Record initial status history
    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        fromStatus: null,
        toStatus: task.status,
        changedBy: user.name,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      projectId: task.projectId,
      action: "TASK_CREATE",
      entityType: "Task",
      entityId: task.id,
      details: { taskCode: task.taskCode, title: task.title, status: task.status },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}

