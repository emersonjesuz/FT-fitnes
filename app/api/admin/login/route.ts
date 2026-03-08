import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER = "josi";
const ADMIN_PASS = "123456";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return NextResponse.json({
      ok: true,
      token: Buffer.from(`${ADMIN_USER}:${Date.now()}`).toString("base64"),
    });
  }

  return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
}
