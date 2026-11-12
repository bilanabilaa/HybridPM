import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isAuthorized, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(3, "Nama pengguna minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  roleId: z.string().min(1, "Role wajib dipilih"),
  division: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAuthorized(user.role.name, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        role: true,
        _count: { select: { assignedTasks: true, projectMembers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const roles = await prisma.role.findMany();

    return NextResponse.json({ users, roles });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat pengguna" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAuthorized(user.role.name, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(data.password);
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        roleId: data.roleId,
        division: data.division || "",
        phone: data.phone || "",
        isActive: true,
      },
      include: { role: true },
    });

    await logAudit({
      userId: user.id,
      action: "ADMIN_USER_CREATE",
      entityType: "User",
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role.name },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Gagal membuat pengguna" }, { status: 500 });
  }
}

