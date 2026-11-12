import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const gates = await prisma.projectGate.findMany({
      where: whereClause,
      include: {
        phase: true,
        project: { select: { id: true, name: true, projectCode: true } },
        approvals: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { decidedAt: "desc" },
        },
      },
      orderBy: { gateNumber: "asc" },
    });

    return NextResponse.json({ gates });
  } catch (error) {
    console.error("GET /api/gates error:", error);
    return NextResponse.json({ error: "Gagal memuat Gate" }, { status: 500 });
  }
}

