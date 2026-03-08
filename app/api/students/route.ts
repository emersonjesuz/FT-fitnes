import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function toIsoDate(value: unknown): Date {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function hashPassword(senha: string): string {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  const students = await prisma.student.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  // Nunca retornar o hash da senha
  return NextResponse.json(
    students.map((s) => ({ ...s, senha: s.senha ? "••••••" : null }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = String(body?.userId || "").trim();
  const nome = String(body?.nome || "").trim();

  if (!userId || !nome) {
    return NextResponse.json({ message: "userId e nome sao obrigatorios" }, { status: 400 });
  }

  const senhaRaw = typeof body?.senha === "string" && body.senha.trim() ? body.senha.trim() : null;

  const student = await prisma.student.create({
    data: {
      id: typeof body?.id === "string" && body.id ? body.id : randomUUID(),
      userId,
      nome,
      biotipo: String(body?.biotipo || "Ectomorfo"),
      idade: Number(body?.idade || 0),
      altura: Number(body?.altura || 0),
      peso: Number(body?.peso || 0),
      observacoes: typeof body?.observacoes === "string" ? body.observacoes : null,
      historicoPeso: body?.historicoPeso ?? undefined,
      senha: senhaRaw ? hashPassword(senhaRaw) : null,
      createdAt: toIsoDate(body?.createdAt),
    },
  });

  return NextResponse.json({ ...student, senha: student.senha ? "••••••" : null }, { status: 201 });
}
