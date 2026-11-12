import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAudit({
        userId: user.id,
        action: "LOGOUT",
        entityType: "User",
        entityId: user.id,
        details: { email: user.email },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    const response = NextResponse.json({ success: true, message: "Berhasil keluar" });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

