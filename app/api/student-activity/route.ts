import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const alunoId = request.nextUrl.searchParams.get("alunoId");
  const treinoId = request.nextUrl.searchParams.get("treinoId");

  const activities = await prisma.studentActivity.findMany({
    where: {
      ...(alunoId ? { alunoId } : {}),
      ...(treinoId ? { treinoId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { alunoId, treinoId, tempoVisualizacao, concluido } = body;

  if (!alunoId || !treinoId) {
    return NextResponse.json(
      { message: "alunoId e treinoId são obrigatórios" },
      { status: 400 }
    );
  }

  // Upsert: cria ou atualiza
  const activity = await prisma.studentActivity.upsert({
    where: { alunoId_treinoId: { alunoId, treinoId } },
    create: {
      id: randomUUID(),
      alunoId,
      treinoId,
      tempoVisualizacao: tempoVisualizacao ?? 0,
      concluido: concluido ?? false,
      dataConclusao: concluido ? new Date() : null,
    },
    update: {
      tempoVisualizacao: tempoVisualizacao ?? 0,
      concluido: concluido ?? false,
      dataConclusao: concluido ? new Date() : null,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
