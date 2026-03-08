import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface Payload {
  users?: Array<{ id?: string; username?: string; password?: string; createdAt?: string }>;
  students?: Array<{
    id?: string;
    userId?: string;
    nome?: string;
    biotipo?: string;
    idade?: number;
    altura?: number;
    peso?: number;
    observacoes?: string;
    historicoPeso?: unknown;
    createdAt?: string;
  }>;
  workouts?: Array<{
    id?: string;
    userId?: string;
    studentId?: string;
    objetivo?: string;
    nivel?: string;
    dias?: unknown;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

function toDate(value: unknown): Date {
  if (typeof value !== "string") return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Payload;
  const users = Array.isArray(body.users) ? body.users : [];
  const students = Array.isArray(body.students) ? body.students : [];
  const workouts = Array.isArray(body.workouts) ? body.workouts : [];

  let usersUpserted = 0;
  let studentsUpserted = 0;
  let workoutsUpserted = 0;

  for (const user of users) {
    if (!user.id || !user.username || !user.password) continue;
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username: user.username,
        password: user.password,
        createdAt: toDate(user.createdAt),
      },
      update: {
        username: user.username,
        password: user.password,
      },
    });
    usersUpserted += 1;
  }

  for (const student of students) {
    if (!student.id || !student.userId || !student.nome) continue;

    const ownerExists = await prisma.user.findUnique({ where: { id: student.userId }, select: { id: true } });
    if (!ownerExists) continue;

    await prisma.student.upsert({
      where: { id: student.id },
      create: {
        id: student.id,
        userId: student.userId,
        nome: student.nome,
        biotipo: student.biotipo || "Ectomorfo",
        idade: Number(student.idade || 0),
        altura: Number(student.altura || 0),
        peso: Number(student.peso || 0),
        observacoes: student.observacoes || null,
        historicoPeso: toJson(student.historicoPeso),
        createdAt: toDate(student.createdAt),
      },
      update: {
        nome: student.nome,
        biotipo: student.biotipo || "Ectomorfo",
        idade: Number(student.idade || 0),
        altura: Number(student.altura || 0),
        peso: Number(student.peso || 0),
        observacoes: student.observacoes || null,
        historicoPeso: toJson(student.historicoPeso),
      },
    });
    studentsUpserted += 1;
  }

  for (const workout of workouts) {
    if (!workout.id || !workout.userId || !workout.studentId) continue;

    const [ownerExists, studentExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: workout.userId }, select: { id: true } }),
      prisma.student.findUnique({ where: { id: workout.studentId }, select: { id: true } }),
    ]);

    if (!ownerExists || !studentExists) continue;

    await prisma.workout.upsert({
      where: { id: workout.id },
      create: {
        id: workout.id,
        userId: workout.userId,
        studentId: workout.studentId,
        objetivo: workout.objetivo || "Hipertrofia",
        nivel: workout.nivel || "Iniciante",
        dias: toJson(workout.dias) || [],
        createdAt: toDate(workout.createdAt),
        updatedAt: toDate(workout.updatedAt),
      },
      update: {
        userId: workout.userId,
        studentId: workout.studentId,
        objetivo: workout.objetivo || "Hipertrofia",
        nivel: workout.nivel || "Iniciante",
        dias: toJson(workout.dias) || [],
        updatedAt: toDate(workout.updatedAt),
      },
    });
    workoutsUpserted += 1;
  }

  return NextResponse.json({ usersUpserted, studentsUpserted, workoutsUpserted });
}
