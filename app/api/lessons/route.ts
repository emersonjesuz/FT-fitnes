import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  const lessons = await prisma.lesson.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lessons);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = String(body?.userId || "").trim();
  const nome = String(body?.nome || "").trim();
  const videoUrl = String(body?.videoUrl || "").trim();

  if (!userId || !nome || !videoUrl) {
    return NextResponse.json(
      { message: "userId, nome e videoUrl são obrigatórios" },
      { status: 400 }
    );
  }

  const lesson = await prisma.lesson.create({
    data: {
      id: randomUUID(),
      userId,
      nome,
      videoUrl,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
