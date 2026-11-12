import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(user.role.name, ["OWNER", "PM", "ADMIN"])) {
      return NextResponse.json(
        { error: "Hanya Owner atau PM yang dapat memutuskan Change Request" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { decision, notes } = body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(decision)) {
      return NextResponse.json({ error: "Keputusan harus disetujui atau ditolak" }, { status: 400 });
    }

    const cr = await prisma.changeRequest.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!cr) return NextResponse.json({ error: "CR tidak ditemukan" }, { status: 404 });

    const updated = await prisma.changeRequest.update({
      where: { id: params.id },
      data: {
        status: decision,
        decisionNotes: notes || "",
        decidedAt: new Date(),
        decidedBy: user.name,
      },
    });

    // If approved and has cost impact, optionally reflect in project budget
    if (decision === "Approved" && cr.costImpact > 0) {
      await prisma.project.update({
        where: { id: cr.projectId },
        data: { budget: { increment: cr.costImpact } },
      });
    }

    await logAudit({
      userId: user.id,
      projectId: cr.projectId,
      action: decision === "Approved" ? "CR_APPROVE" : "CR_REJECT",
      entityType: "ChangeRequest",
      entityId: cr.id,
      details: { crCode: cr.crCode, decision, notes },
    });

    return NextResponse.json({ success: true, changeRequest: updated });
  } catch (error) {
    console.error("CR decide error:", error);
    return NextResponse.json({ error: "Gagal memproses keputusan CR" }, { status: 500 });
  }
}

