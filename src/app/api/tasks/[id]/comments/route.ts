import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        userId: user.id,
        comment: body.comment.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, division: true } },
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambahkan komentar" }, { status: 500 });
  }
}

