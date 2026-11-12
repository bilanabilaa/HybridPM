import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createDocumentSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3, "Judul dokumen minimal 3 karakter"),
  category: z.string().min(1, "Kategori dokumen wajib dipilih"),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().default(1024),
  versionNumber: z.string().default("1.0"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (category && category !== "ALL") whereClause.category = category;

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        versions: { orderBy: { uploadedAt: "desc" } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat dokumen" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = createDocumentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const data = result.data;

    // Check if document with same title exists in project for versioning
    const existing = await prisma.document.findFirst({
      where: { projectId: data.projectId, title: data.title },
    });

    let doc;
    if (existing) {
      // Create new version for existing document
      doc = await prisma.document.update({
        where: { id: existing.id },
        data: {
          currentVersion: data.versionNumber,
          updatedAt: new Date(),
        },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          versionNumber: data.versionNumber,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          notes: data.notes || "Revisi dokumen baru",
        },
      });
    } else {
      // Create fresh document
      doc = await prisma.document.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          category: data.category,
          currentVersion: data.versionNumber,
          status: "Draft",
          uploadedById: user.id,
        },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: data.versionNumber,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          notes: data.notes || "Versi awal dokumen",
        },
      });
    }

    await logAudit({
      userId: user.id,
      projectId: data.projectId,
      action: existing ? "DOCUMENT_VERSION_ADD" : "DOCUMENT_CREATE",
      entityType: "Document",
      entityId: doc.id,
      details: { title: doc.title, version: data.versionNumber },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Gagal menyimpan dokumen" }, { status: 500 });
  }
}

