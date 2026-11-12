import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createProjectSchema = z.object({
  projectCode: z.string().min(3, "Kode proyek minimal 3 karakter"),
  name: z.string().min(5, "Nama proyek minimal 5 karakter"),
  description: z.string().optional(),
  ownerId: z.string().min(1, "Owner wajib dipilih"),
  managerId: z.string().min(1, "Project Manager wajib dipilih"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  targetDate: z.string().min(1, "Target selesai wajib diisi"),
  budget: z.number().nonnegative("Anggaran harus bernilai positif"),
  methodology: z.enum(["Waterfall", "Kanban", "Hybrid"]).default("Hybrid"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const managerId = searchParams.get("managerId");
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (managerId) {
      whereClause.managerId = managerId;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { projectCode: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Role-based visibility:
    // OWNER, PM, ADMIN can see all projects
    // MEMBER and STAKEHOLDER see projects they are assigned to
    if (["MEMBER", "STAKEHOLDER"].includes(user.role.name)) {
      whereClause.members = {
        some: { userId: user.id },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        phases: { select: { id: true, name: true, status: true, progress: true } },
        gates: { select: { id: true, gateNumber: true, name: true, status: true } },
        _count: {
          select: {
            tasks: true,
            risks: true,
            documents: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar proyek" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorized(user.role.name, ["OWNER", "PM", "ADMIN"])) {
      return NextResponse.json(
        { error: "Hanya Owner, PM, atau Admin yang dapat membuat proyek baru" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validasi gagal" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check code uniqueness
    const existing = await prisma.project.findUnique({
      where: { projectCode: data.projectCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Kode proyek ${data.projectCode} sudah digunakan` },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        description: data.description || "",
        ownerId: data.ownerId,
        managerId: data.managerId,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        budget: data.budget,
        methodology: data.methodology,
        priority: data.priority,
        status: "Active",
        progress: 0,
      },
    });

    // Auto-create 7 Waterfall Phases
    const phases = [
      { num: 1, name: "Inisiasi dan Perencanaan", desc: "Kick-off, Project Charter, Scope, dan Perencanaan" },
      { num: 2, name: "Analisis Kebutuhan", desc: "Wawancara, Workshop, dan Penyusunan SRS" },
      { num: 3, name: "Desain Sistem", desc: "Arsitektur Sistem, ERD, dan UI/UX Prototype" },
      { num: 4, name: "Implementasi", desc: "Pengembangan modul sistem dengan papan Kanban" },
      { num: 5, name: "Pengujian", desc: "Functional testing, integration testing, defect fixing" },
      { num: 6, name: "UAT, Deployment, dan Pelatihan", desc: "Pengujian pengguna, live deployment, pelatihan" },
      { num: 7, name: "Penutupan dan Serah Terima", desc: "Evaluasi, lessons learned, final report, BAST" },
    ];

    const phaseLengthDays = Math.max(14, Math.floor((new Date(data.targetDate).getTime() - new Date(data.startDate).getTime()) / (7 * 86400000)));

    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      const pStart = new Date(new Date(data.startDate).getTime() + i * phaseLengthDays * 86400000);
      const pTarget = new Date(new Date(data.startDate).getTime() + (i + 1) * phaseLengthDays * 86400000);

      const createdPhase = await prisma.projectPhase.create({
        data: {
          projectId: project.id,
          phaseNumber: p.num,
          name: p.name,
          description: p.desc,
          startDate: pStart,
          targetDate: pTarget,
          status: i === 0 ? "In Progress" : "Not Started",
          progress: 0,
        },
      });

      // Create Gate for phase
      await prisma.projectGate.create({
        data: {
          projectId: project.id,
          phaseId: createdPhase.id,
          gateNumber: p.num,
          name: `Gate ${p.num}: Verifikasi Fase ${p.name}`,
          criteria: `Persetujuan kelengkapan deliverable dan kualitas fase ${p.name}`,
          status: "Not Submitted",
        },
      });
    }

    // Auto-create Project Charter & Scope
    await prisma.projectCharter.create({
      data: {
        projectId: project.id,
        background: `Inisiasi proyek ${project.name}`,
        objectives: `Tercapainya tujuan proyek sesuai jadwal dan anggaran ${project.budget}`,
        scopeSummary: project.description || "Ruang lingkup terdefinisi pada fase inisiasi.",
        successCriteria: "Lolos UAT >= 95%, ketersediaan sistem >= 99%.",
      },
    });

    await prisma.projectScope.create({
      data: {
        projectId: project.id,
        inScope: "Pengembangan modul sistem, integrasi, pelatihan, dan serah terima.",
        outOfScope: "Pengadaan perangkat keras tambahan di luar spesifikasi.",
      },
    });

    // Auto-create Budget breakdown with prompt formula
    const labor = data.budget * 0.755;
    const nonLabor = data.budget * 0.0638;
    const direct = labor + nonLabor;
    const contingency = direct * 0.10;
    const subtotal = direct + contingency;
    const tax = subtotal * 0.11;

    const budgetRec = await prisma.budget.create({
      data: {
        projectId: project.id,
        totalLaborCost: labor,
        totalNonLaborCost: nonLabor,
        directCost: direct,
        contingencyRate: 0.10,
        contingencyCost: contingency,
        subtotal: subtotal,
        taxRate: 0.11,
        taxAmount: tax,
        totalBudget: data.budget,
      },
    });

    // Create 5 Termin items
    const termins = [
      { name: "Termin 1 (20%): Uang Muka & Persetujuan Inisiasi", pct: 20 },
      { name: "Termin 2 (20%): Persetujuan SRS & Desain", pct: 20 },
      { name: "Termin 3 (30%): Selesai Modul Utama di Staging", pct: 30 },
      { name: "Termin 4 (20%): Lolos UAT & Pelatihan", pct: 20 },
      { name: "Termin 5 (10%): BAST Serah Terima Akhir", pct: 10 },
    ];

    for (const t of termins) {
      await prisma.budgetItem.create({
        data: {
          budgetId: budgetRec.id,
          category: "Termin",
          name: t.name,
          allocatedAmount: (data.budget * t.pct) / 100,
          percentage: t.pct,
          isPaid: false,
        },
      });
    }

    // Add PM and Owner to project members
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: data.managerId,
        roleInProject: "Project Manager",
        division: "PMO",
      },
    });

    if (data.ownerId !== data.managerId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: data.ownerId,
          roleInProject: "Project Owner",
          division: "Steering Committee",
        },
      });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      projectId: project.id,
      action: "PROJECT_CREATE",
      entityType: "Project",
      entityId: project.id,
      details: { code: project.projectCode, name: project.name },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Gagal membuat proyek baru" }, { status: 500 });
  }
}

