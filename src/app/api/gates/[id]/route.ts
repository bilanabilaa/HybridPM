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

    const body = await req.json();
    const action = body.action; // "SUBMIT", "APPROVE", "REJECT"
    const notes = body.notes || "";

    const gate = await prisma.projectGate.findUnique({
      where: { id: params.id },
      include: { phase: true, project: true },
    });

    if (!gate) return NextResponse.json({ error: "Gate tidak ditemukan" }, { status: 404 });

    // 1. SUBMIT GATE (Only PM or Admin)
    if (action === "SUBMIT") {
      if (!isAuthorized(user.role.name, ["PM", "ADMIN"])) {
        return NextResponse.json(
          { error: "Hanya Project Manager yang berwenang mengajukan persetujuan Gate" },
          { status: 403 }
        );
      }

      // Check if previous gate is approved (except Gate 1)
      if (gate.gateNumber > 1) {
        const prevGate = await prisma.projectGate.findFirst({
          where: {
            projectId: gate.projectId,
            gateNumber: gate.gateNumber - 1,
          },
        });
        if (prevGate && prevGate.status !== "Approved") {
          return NextResponse.json(
            {
              error: `Gate ${prevGate.gateNumber} belum disetujui! Fase Waterfall harus disetujui secara berurutan.`,
            },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.projectGate.update({
        where: { id: params.id },
        data: {
          status: "Pending Approval",
          submittedAt: new Date(),
          decisionNotes: notes || null,
        },
      });

      await logAudit({
        userId: user.id,
        projectId: gate.projectId,
        action: "GATE_SUBMIT",
        entityType: "Gate",
        entityId: gate.id,
        details: { gateNumber: gate.gateNumber, name: gate.name },
      });

      return NextResponse.json({ success: true, gate: updated, message: "Pengajuan Gate berhasil dikirim ke Owner" });
    }

    // 2. APPROVE GATE (Only OWNER or Admin)
    if (action === "APPROVE") {
      if (!isAuthorized(user.role.name, ["OWNER", "ADMIN"])) {
        return NextResponse.json(
          { error: "Hanya Project Owner yang memiliki kewenangan menyetujui Gate" },
          { status: 403 }
        );
      }

      const digitalSignatureToken = `SIG-GATE-${gate.gateNumber}-${user.id.slice(-6)}-${Date.now()}`;

      // Update Gate status
      const updatedGate = await prisma.projectGate.update({
        where: { id: params.id },
        data: {
          status: "Approved",
          decisionAt: new Date(),
          decisionNotes: notes,
        },
      });

      // Record approval signature
      await prisma.gateApproval.create({
        data: {
          gateId: gate.id,
          approverId: user.id,
          status: "Approved",
          comments: notes,
          signatureToken: digitalSignatureToken,
          decidedAt: new Date(),
        },
      });

      // Mark current phase as Completed
      await prisma.projectPhase.update({
        where: { id: gate.phaseId },
        data: {
          status: "Completed",
          progress: 100,
          actualEndDate: new Date(),
          evalNotes: notes,
        },
      });

      // Advance next phase to "In Progress"
      const nextPhase = await prisma.projectPhase.findFirst({
        where: {
          projectId: gate.projectId,
          phaseNumber: gate.phase.phaseNumber + 1,
        },
      });

      if (nextPhase && nextPhase.status === "Not Started") {
        await prisma.projectPhase.update({
          where: { id: nextPhase.id },
          data: { status: "In Progress" },
        });
      }

      // If Gate 7 approved, mark project Completed!
      if (gate.gateNumber === 7) {
        await prisma.project.update({
          where: { id: gate.projectId },
          data: { status: "Completed", progress: 100, endDate: new Date() },
        });
      }

      await logAudit({
        userId: user.id,
        projectId: gate.projectId,
        action: "GATE_APPROVE",
        entityType: "Gate",
        entityId: gate.id,
        details: { gateNumber: gate.gateNumber, signatureToken: digitalSignatureToken, notes },
      });

      return NextResponse.json({
        success: true,
        gate: updatedGate,
        message: `Gate ${gate.gateNumber} berhasil disetujui secara resmi dengan stempel digital.`,
      });
    }

    // 3. REJECT GATE (Only OWNER or Admin)
    if (action === "REJECT") {
      if (!isAuthorized(user.role.name, ["OWNER", "ADMIN"])) {
        return NextResponse.json(
          { error: "Hanya Project Owner yang memiliki kewenangan menolak Gate" },
          { status: 403 }
        );
      }

      if (!notes || !notes.trim()) {
        return NextResponse.json(
          { error: "Alasan penolakan dan instruksi revisi wajib dicantumkan!" },
          { status: 400 }
        );
      }

      const updatedGate = await prisma.projectGate.update({
        where: { id: params.id },
        data: {
          status: "Revision Required",
          decisionAt: new Date(),
          decisionNotes: notes,
        },
      });

      await prisma.gateApproval.create({
        data: {
          gateId: gate.id,
          approverId: user.id,
          status: "Revision Required",
          comments: notes,
          decidedAt: new Date(),
        },
      });

      await logAudit({
        userId: user.id,
        projectId: gate.projectId,
        action: "GATE_REJECT",
        entityType: "Gate",
        entityId: gate.id,
        details: { gateNumber: gate.gateNumber, notes },
      });

      return NextResponse.json({
        success: true,
        gate: updatedGate,
        message: `Gate ${gate.gateNumber} dikembalikan dengan catatan revisi untuk diperbaiki oleh PM.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/gates/[id] error:", error);
    return NextResponse.json({ error: "Gagal memproses persetujuan Gate" }, { status: 500 });
  }
}

