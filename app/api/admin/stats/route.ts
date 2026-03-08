import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    totalStudents,
    totalPersonals,
    totalWorkouts,
    totalLessons,
    totalActivities,
    concludedActivities,
    recentStudents,
    recentWorkouts,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.user.count(),
    prisma.workout.count(),
    prisma.lesson.count(),
    prisma.studentActivity.count(),
    prisma.studentActivity.count({ where: { concluido: true } }),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, nome: true, createdAt: true },
    }),
    prisma.workout.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, objetivo: true, nivel: true, createdAt: true },
    }),
  ]);

  // Alunos por personal
  const studentsByPersonal = await prisma.student.groupBy({
    by: ["userId"],
    _count: { id: true },
  });

  // Treinos por objetivo
  const workoutsByObj = await prisma.workout.groupBy({
    by: ["objetivo"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Treinos por nível
  const workoutsByNivel = await prisma.workout.groupBy({
    by: ["nivel"],
    _count: { id: true },
  });

  return NextResponse.json({
    totalStudents,
    totalPersonals,
    totalWorkouts,
    totalLessons,
    totalActivities,
    concludedActivities,
    completionRate: totalActivities > 0 ? Math.round((concludedActivities / totalActivities) * 100) : 0,
    recentStudents,
    recentWorkouts,
    workoutsByObj: workoutsByObj.map((w) => ({
      name: w.objetivo,
      value: w._count.id,
    })),
    workoutsByNivel: workoutsByNivel.map((w) => ({
      name: w.nivel,
      value: w._count.id,
    })),
    avgStudentsPerPersonal: totalPersonals > 0 ? Math.round(totalStudents / totalPersonals) : 0,
  });
}
