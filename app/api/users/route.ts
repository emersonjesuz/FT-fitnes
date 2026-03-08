import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toIsoDate(value: unknown): Date {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (username) {
    const user = await prisma.user.findUnique({ where: { username } });
    return NextResponse.json(user);
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "").trim();

  if (!username || !password) {
    return NextResponse.json({ message: "username e password sao obrigatorios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(existing);
  }

  const user = await prisma.user.create({
    data: {
      id: typeof body?.id === "string" && body.id ? body.id : randomUUID(),
      username,
      password,
      createdAt: toIsoDate(body?.createdAt),
    },
  });

  return NextResponse.json(user, { status: 201 });
}
