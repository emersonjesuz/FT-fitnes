import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toIsoDate(value: unknown): Date {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  const workouts = await prisma.workout.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workouts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = String(body?.userId || "").trim();
  const studentId = String(body?.studentId || "").trim();

  if (!userId || !studentId) {
    return NextResponse.json({ message: "userId e studentId sao obrigatorios" }, { status: 400 });
  }

  const workout = await prisma.workout.create({
    data: {
      id: typeof body?.id === "string" && body.id ? body.id : randomUUID(),
      userId,
      studentId,
      objetivo: String(body?.objetivo || "Hipertrofia"),
      nivel: String(body?.nivel || "Iniciante"),
      dias: body?.dias ?? [],
      createdAt: toIsoDate(body?.createdAt),
      updatedAt: toIsoDate(body?.updatedAt),
    },
  });

  return NextResponse.json(workout, { status: 201 });
}
