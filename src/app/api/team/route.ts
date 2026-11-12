import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const members = await prisma.projectMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            division: true,
            role: true,
            phone: true,
            avatar: true,
            _count: {
              select: {
                assignedTasks: true,
              },
            },
          },
        },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, division: true, role: true },
    });

    return NextResponse.json({ members, availableUsers: allUsers });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat tim" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(user.role.name, ["PM", "OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, userId, roleInProject, division } = body;

    if (!projectId || !userId || !roleInProject) {
      return NextResponse.json({ error: "Data anggota tidak lengkap" }, { status: 400 });
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: { roleInProject, division },
      create: { projectId, userId, roleInProject, division },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: user.id,
      projectId,
      action: "TEAM_ADD_MEMBER",
      entityType: "ProjectMember",
      entityId: member.id,
      details: { memberName: member.user.name, roleInProject },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambahkan anggota tim" }, { status: 500 });
  }
}

