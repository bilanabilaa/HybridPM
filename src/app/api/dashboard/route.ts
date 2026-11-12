import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleName = user.role.name;

    // 1. Common baseline counts
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({ where: { status: "Active" } });
    const completedProjects = await prisma.project.count({ where: { status: "Completed" } });
    const totalTasks = await prisma.task.count();
    const doneTasks = await prisma.task.count({ where: { status: "Done" } });
    const pendingGates = await prisma.projectGate.count({ where: { status: "Pending Approval" } });
    const criticalRisks = await prisma.risk.count({ where: { severity: "Critical" } });

    // Recent activities
    const recentActivities = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    // 2. Budget aggregations
    const allBudgets = await prisma.budget.findMany({
      include: { expenses: true },
    });
    const totalAllocatedBudget = allBudgets.reduce((acc, b) => acc + b.totalBudget, 0);
    const totalActualCost = allBudgets.reduce(
      (acc, b) => acc + b.expenses.reduce((s, e) => s + e.amount, 0),
      0
    );
    const totalRemainingBudget = totalAllocatedBudget - totalActualCost;

    // 3. Role-specific data
    let roleSpecificData: any = {};

    if (roleName === "OWNER") {
      const projects = await prisma.project.findMany({
        include: {
          phases: true,
          gates: { where: { status: "Pending Approval" } },
          milestones: { where: { isReached: false }, take: 4, orderBy: { targetDate: "asc" } },
        },
      });
      const avgProgress =
        projects.length > 0
          ? Number((projects.reduce((a, b) => a + b.progress, 0) / projects.length).toFixed(1))
          : 0;

      roleSpecificData = {
        avgProgress,
        pendingGatesList: await prisma.projectGate.findMany({
          where: { status: "Pending Approval" },
          include: { project: true, phase: true },
        }),
        upcomingMilestones: await prisma.milestone.findMany({
          where: { isReached: false },
          orderBy: { targetDate: "asc" },
          take: 5,
          include: { project: true },
        }),
      };
    } else if (roleName === "PM") {
      const managed = await prisma.project.findMany({
        where: { managerId: user.id },
      });
      const tasksByStatus = {
        backlog: await prisma.task.count({ where: { status: "Backlog" } }),
        analisis: await prisma.task.count({ where: { status: "Analisis" } }),
        develop: await prisma.task.count({ where: { status: "Develop" } }),
        review: await prisma.task.count({ where: { status: "Review" } }),
        test: await prisma.task.count({ where: { status: "Test" } }),
        done: await prisma.task.count({ where: { status: "Done" } }),
      };
      const pendingCRs = await prisma.changeRequest.count({ where: { status: "Pending" } });

      roleSpecificData = {
        managedCount: managed.length,
        tasksByStatus,
        pendingCRs,
        wipCount: tasksByStatus.develop + tasksByStatus.review + tasksByStatus.test,
        pendingGatesCount: pendingGates,
      };
    } else if (roleName === "MEMBER") {
      const myTasksList = await prisma.task.findMany({
        where: { assigneeId: user.id },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      });
      const myCompleted = myTasksList.filter((t) => t.status === "Done").length;
      const myProgress = myTasksList.length > 0 ? Math.round((myCompleted / myTasksList.length) * 100) : 0;

      roleSpecificData = {
        myTasks: myTasksList,
        myTotalTasks: myTasksList.length,
        myCompletedTasks: myCompleted,
        myProgress,
        myReviewTasks: myTasksList.filter((t) => t.status === "Review"),
      };
    } else if (roleName === "STAKEHOLDER") {
      const joinedProjects = await prisma.project.findMany({
        where: { members: { some: { userId: user.id } } },
        include: { phases: true, milestones: true },
      });

      roleSpecificData = {
        joinedProjects,
        approvedDocumentsCount: await prisma.document.count({ where: { status: "Approved" } }),
      };
    } else if (roleName === "ADMIN") {
      const totalUsersCount = await prisma.user.count();
      const activeUsersCount = await prisma.user.count({ where: { isActive: true } });
      const usersByRole = await prisma.role.findMany({
        include: { _count: { select: { users: true } } },
      });

      roleSpecificData = {
        totalUsersCount,
        activeUsersCount,
        usersByRole,
      };
    }

    return NextResponse.json({
      role: roleName,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        division: user.division,
        roleLabel: user.role.label,
      },
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        doneTasks,
        pendingGates,
        criticalRisks,
        totalAllocatedBudget,
        totalActualCost,
        totalRemainingBudget,
      },
      roleSpecificData,
      recentActivities,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}

