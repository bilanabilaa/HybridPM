import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const criteria = await prisma.methodologyCriterion.findMany({
      orderBy: { orderIndex: "asc" },
    });

    const assessments = await prisma.methodologyAssessment.findMany({
      include: {
        assessor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ criteria, assessments });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat kriteria metodologi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, projectName, answers } = body; // answers: [{ criterionId, optionIndex }]

    if (!projectName || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Kuesioner belum lengkap diisi" }, { status: 400 });
    }

    const criteria = await prisma.methodologyCriterion.findMany();
    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

    let totalWeight = 0;
    let weightedWaterfall = 0;
    let weightedKanban = 0;
    let weightedHybrid = 0;

    const answerRecords = [];

    for (const ans of answers) {
      const criterion = criteriaMap.get(ans.criterionId);
      if (!criterion) continue;

      let parsedOptions: any[] = [];
      try {
        parsedOptions = JSON.parse(criterion.options);
      } catch {
        parsedOptions = [];
      }

      const selected = parsedOptions[ans.optionIndex] || parsedOptions[0];
      if (!selected) continue;

      const weight = criterion.weight || 1.0;
      totalWeight += weight;

      weightedWaterfall += (selected.waterfall || 3) * weight;
      weightedKanban += (selected.kanban || 3) * weight;
      weightedHybrid += (selected.hybrid || 4) * weight;

      answerRecords.push({
        criterionId: criterion.id,
        selectedOption: selected.label,
        chosenScore: selected.hybrid || 4,
      });
    }

    const maxPossible = totalWeight * 5;
    const waterfallScore = Number(((weightedWaterfall / maxPossible) * 100).toFixed(1));
    const kanbanScore = Number(((weightedKanban / maxPossible) * 100).toFixed(1));
    const hybridScore = Number(((weightedHybrid / maxPossible) * 100).toFixed(1));

    let recommended = "Hybrid";
    let rationale = "";

    if (hybridScore >= waterfallScore && hybridScore >= kanbanScore) {
      recommended = "Hybrid";
      rationale =
        "Proyek ini paling ideal dijalankan dengan metodologi Hybrid. Struktur tata kelola Waterfall (Fase & Gate) menjamin kepatuhan jadwal, pagu anggaran, dan milestone strategis, sementara fleksibilitas Kanban memberikan transparansi kerja harian, pencegahan kelebihan beban kerja (WIP limits), dan responsivitas pengembangan modul.";
    } else if (waterfallScore > kanbanScore) {
      recommended = "Waterfall";
      rationale =
        "Proyek memiliki karakteristik kebutuhan sangat terdefinisi, toleransi perubahan rendah, dan kewajiban dokumentasi ketat sehingga metodologi sekuensial Waterfall memberikan kepastian tertinggi.";
    } else {
      recommended = "Kanban";
      rationale =
        "Proyek memiliki dinamika kebutuhan tinggi, prioritas kerja yang cepat berubah, dan membutuhkan pengiriman fitur berkelanjutan (continuous delivery) tanpa hambatan birokrasi sekuensial.";
    }

    const assessment = await prisma.methodologyAssessment.create({
      data: {
        projectId: projectId || null,
        assessorId: user.id,
        projectName,
        waterfallScore,
        kanbanScore,
        hybridScore,
        recommendedMethodology: recommended,
        rationale,
      },
    });

    for (const ar of answerRecords) {
      await prisma.methodologyAnswer.create({
        data: {
          assessmentId: assessment.id,
          criterionId: ar.criterionId,
          selectedOption: ar.selectedOption,
          chosenScore: ar.chosenScore,
        },
      });
    }

    await logAudit({
      userId: user.id,
      projectId: projectId || null,
      action: "METHODOLOGY_ASSESSMENT",
      entityType: "MethodologyAssessment",
      entityId: assessment.id,
      details: { projectName, recommended, scores: { waterfallScore, kanbanScore, hybridScore } },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        ...assessment,
        waterfallScore,
        kanbanScore,
        hybridScore,
        recommendedMethodology: recommended,
        rationale,
      },
    });
  } catch (error) {
    console.error("POST /api/methodology error:", error);
    return NextResponse.json({ error: "Gagal memproses penilaian metodologi" }, { status: 500 });
  }
}

