import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

function calculateSeverity(score: number): string {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

const createRiskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3, "Judul risiko minimal 3 karakter"),
  description: z.string().optional(),
  category: z.enum(["Teknis", "Manajemen", "Sumber Daya", "Eksternal"]).default("Teknis"),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigationPlan: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  status: z.enum(["Identified", "Mitigating", "Closed", "Accepted"]).default("Identified"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const risks = await prisma.risk.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        mitigations: true,
      },
      orderBy: { riskScore: "desc" },
    });

    // 5x5 Matrix counts
    const matrix: Record<string, number> = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        matrix[`${p}_${i}`] = 0;
      }
    }
    risks.forEach((r) => {
      const key = `${r.probability}_${r.impact}`;
      if (matrix[key] !== undefined) matrix[key]++;
    });

    return NextResponse.json({ risks, matrix });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat risiko" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = createRiskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;
    const riskScore = data.probability * data.impact;
    const severity = calculateSeverity(riskScore);

    const count = await prisma.risk.count({ where: { projectId: data.projectId } });
    const riskCode = `RSK-${String(count + 1).padStart(3, "0")}`;

    const risk = await prisma.risk.create({
      data: {
        projectId: data.projectId,
        riskCode,
        title: data.title,
        description: data.description || "",
        category: data.category,
        probability: data.probability,
        impact: data.impact,
        riskScore,
        severity,
        mitigationPlan: data.mitigationPlan || "",
        ownerId: data.ownerId || null,
        status: data.status,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: user.id,
      projectId: data.projectId,
      action: "RISK_CREATE",
      entityType: "Risk",
      entityId: risk.id,
      details: { riskCode: risk.riskCode, title: risk.title, severity, riskScore },
    });

    return NextResponse.json({ success: true, risk }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencatat risiko" }, { status: 500 });
  }
}

