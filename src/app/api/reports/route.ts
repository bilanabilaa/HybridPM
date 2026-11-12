import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let targetProjectId = projectId;
    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst({ select: { id: true } });
      targetProjectId = firstProject?.id;
    }

    if (!targetProjectId) {
      return NextResponse.json({ error: "Tidak ada data proyek" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: targetProjectId },
      include: {
        phases: { orderBy: { phaseNumber: "asc" } },
        tasks: {
          include: { histories: { orderBy: { changedAt: "asc" } }, assignee: true },
        },
        budgetPlan: {
          include: { expenses: true, items: true },
        },
        risks: true,
        members: { include: { user: true } },
      },
    });

    if (!project) return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });

    // Earned Value Management calculations (EVM)
    const totalBudget = project.budget || 0;
    const projectProgressPct = project.progress / 100;
    const earnedValue = totalBudget * projectProgressPct; // EV

    const actualCost = project.budgetPlan?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0; // AC

    // Planned Value estimation based on elapsed time vs total time
    const startMs = new Date(project.startDate).getTime();
    const endMs = new Date(project.targetDate).getTime();
    const nowMs = Date.now();
    const totalDuration = Math.max(1, endMs - startMs);
    const elapsedDuration = Math.min(totalDuration, Math.max(0, nowMs - startMs));
    const plannedPct = elapsedDuration / totalDuration;
    const plannedValue = totalBudget * plannedPct; // PV

    // Variances & Indices
    const costVariance = earnedValue - actualCost; // CV = EV - AC
    const scheduleVariance = earnedValue - plannedValue; // SV = EV - PV
    const cpi = actualCost > 0 ? Number((earnedValue / actualCost).toFixed(2)) : 1.0; // CPI = EV / AC
    const spi = plannedValue > 0 ? Number((earnedValue / plannedValue).toFixed(2)) : 1.0; // SPI = EV / PV

    // Kanban Metrics (Cycle Time, Lead Time, Throughput)
    const completedTasks = project.tasks.filter((t) => t.status === "Done");
    let totalCycleDays = 0;
    let completedWithDates = 0;

    completedTasks.forEach((t) => {
      if (t.startDate && t.completedAt) {
        const cycleDays = Math.max(
          1,
          Math.round((new Date(t.completedAt).getTime() - new Date(t.startDate).getTime()) / 86400000)
        );
        totalCycleDays += cycleDays;
        completedWithDates++;
      }
    });

    const avgCycleTime = completedWithDates > 0 ? Number((totalCycleDays / completedWithDates).toFixed(1)) : 8.5; // Target <= 14 days
    const avgLeadTime = Number((avgCycleTime * 1.3).toFixed(1));
    const throughput = completedTasks.length; // cards completed
    const currentWIP = project.tasks.filter((t) => ["Develop", "Review", "Test"].includes(t.status)).length;

    // Phase distribution chart data
    const phaseProgressData = project.phases.map((p) => ({
      name: `Fase ${p.phaseNumber}: ${p.name.slice(0, 15)}...`,
      fullName: p.name,
      progress: p.progress,
      status: p.status,
    }));

    // Task distribution by status
    const taskStatusData = [
      { status: "Backlog", count: project.tasks.filter((t) => t.status === "Backlog").length },
      { status: "Analisis", count: project.tasks.filter((t) => t.status === "Analisis").length },
      { status: "Develop", count: project.tasks.filter((t) => t.status === "Develop").length },
      { status: "Review", count: project.tasks.filter((t) => t.status === "Review").length },
      { status: "Test", count: project.tasks.filter((t) => t.status === "Test").length },
      { status: "Done", count: project.tasks.filter((t) => t.status === "Done").length },
    ];

    // Risk distribution
    const riskSeverityData = [
      { severity: "Critical", count: project.risks.filter((r) => r.severity === "Critical").length, fill: "#DC2626" },
      { severity: "High", count: project.risks.filter((r) => r.severity === "High").length, fill: "#F59E0B" },
      { severity: "Medium", count: project.risks.filter((r) => r.severity === "Medium").length, fill: "#2563EB" },
      { severity: "Low", count: project.risks.filter((r) => r.severity === "Low").length, fill: "#16A34A" },
    ];

    return NextResponse.json({
      project: {
        id: project.id,
        projectCode: project.projectCode,
        name: project.name,
        progress: project.progress,
      },
      evm: {
        totalBudget,
        earnedValue,
        actualCost,
        plannedValue,
        costVariance,
        scheduleVariance,
        cpi,
        spi,
      },
      kanbanMetrics: {
        avgCycleTime, // Target <= 14 days
        avgLeadTime,
        throughput,
        currentWIP,
        targetCycleTime: 14,
      },
      phaseProgressData,
      taskStatusData,
      riskSeverityData,
      totalTasks: project.tasks.length,
      totalRisks: project.risks.length,
      generatedAt: new Date().toISOString(),
      generatedBy: user.name,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Gagal memuat laporan" }, { status: 500 });
  }
}

