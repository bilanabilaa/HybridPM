import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createExpenseSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(3, "Deskripsi pengeluaran wajib diisi"),
  category: z.enum(["SDM", "Infrastruktur", "Lisensi", "Operasional", "Kontingensi"]),
  amount: z.number().positive("Jumlah biaya harus lebih dari 0"),
  expenseDate: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const budget = await prisma.budget.findFirst({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        items: { orderBy: { createdAt: "asc" } },
        expenses: { orderBy: { expenseDate: "desc" } },
      },
    });

    if (!budget) {
      return NextResponse.json({ budget: null, summary: null });
    }

    // Dynamic calculations from database
    const totalActualExpense = budget.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingBudget = budget.totalBudget - totalActualExpense;
    const costVariance = budget.totalBudget - totalActualExpense; // Positive means under budget
    const expensePercentage = ((totalActualExpense / budget.totalBudget) * 100).toFixed(1);

    // Sum expenses by category
    const categoryBreakdown: Record<string, number> = {};
    budget.expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    return NextResponse.json({
      budget,
      summary: {
        totalBudget: budget.totalBudget,
        totalLaborCost: budget.totalLaborCost,
        totalNonLaborCost: budget.totalNonLaborCost,
        contingencyCost: budget.contingencyCost,
        totalActualExpense,
        remainingBudget,
        costVariance,
        expensePercentage: Number(expensePercentage),
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return NextResponse.json({ error: "Gagal memuat anggaran" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only PM, OWNER, or ADMIN can record expenses
    if (!isAuthorized(user.role.name, ["PM", "OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const result = createExpenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;

    // Contingency rule: Only OWNER can authorize contingency expense
    if (data.category === "Kontingensi" && user.role.name !== "OWNER") {
      return NextResponse.json(
        { error: "Penggunaan Dana Cadangan Kontingensi hanya dapat diotorisasi oleh Project Owner!" },
        { status: 403 }
      );
    }

    let budget = await prisma.budget.findUnique({
      where: { projectId: data.projectId },
    });

    if (!budget) {
      return NextResponse.json({ error: "Rencana anggaran proyek belum dibuat" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        budgetId: budget.id,
        description: data.description,
        category: data.category,
        amount: data.amount,
        expenseDate: new Date(data.expenseDate),
        isApproved: true,
        approvedBy: user.name,
      },
    });

    await logAudit({
      userId: user.id,
      projectId: data.projectId,
      action: "EXPENSE_CREATE",
      entityType: "Expense",
      entityId: expense.id,
      details: { amount: data.amount, category: data.category, description: data.description },
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budget error:", error);
    return NextResponse.json({ error: "Gagal mencatat pengeluaran" }, { status: 500 });
  }
}

