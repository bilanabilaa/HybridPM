import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createWbsSchema = z.object({
  projectId: z.string().min(1),
  wbsCode: z.string().min(1, "Kode WBS wajib diisi"),
  title: z.string().min(3, "Judul aktivitas wajib diisi"),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(["Not Started", "In Progress", "Completed"]).default("Not Started"),
  raciR: z.string().optional(),
  raciA: z.string().optional(),
  raciC: z.string().optional(),
  raciI: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const items = await prisma.wbsItem.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { wbsCode: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat WBS" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = createWbsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;
    const item = await prisma.wbsItem.create({
      data: {
        projectId: data.projectId,
        wbsCode: data.wbsCode,
        title: data.title,
        description: data.description || "",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        progress: data.progress,
        status: data.status,
        raciR: data.raciR || "",
        raciA: data.raciA || "",
        raciC: data.raciC || "",
        raciI: data.raciI || "",
      },
    });

    await logAudit({
      userId: user.id,
      projectId: data.projectId,
      action: "WBS_CREATE",
      entityType: "WbsItem",
      entityId: item.id,
      details: { wbsCode: item.wbsCode, title: item.title },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat WBS" }, { status: 500 });
  }
}

