import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(senha: string): string {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { personalId: string; alunoId: string } }
) {
  const { personalId, alunoId } = params;

  const student = await prisma.student.findFirst({
    where: { id: alunoId, userId: personalId },
    select: {
      id: true,
      nome: true,
      biotipo: true,
      idade: true,
      userId: true,
    },
  });

  if (!student) {
    return NextResponse.json({ message: "Aluno não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ nome: student.nome });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { personalId: string; alunoId: string } }
) {
  const { personalId, alunoId } = params;
  const body = await request.json();
  const senha = String(body?.senha || "").trim();

  if (!senha) {
    return NextResponse.json({ message: "Senha obrigatória" }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { id: alunoId, userId: personalId },
  });

  if (!student) {
    return NextResponse.json({ message: "Aluno não encontrado" }, { status: 404 });
  }

  if (!student.senha) {
    return NextResponse.json(
      { message: "Acesso não configurado. Fale com seu personal." },
      { status: 403 }
    );
  }

  const hashed = hashPassword(senha);
  if (student.senha !== hashed) {
    return NextResponse.json({ message: "Senha incorreta 💪 Tente novamente!" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    student: {
      id: student.id,
      nome: student.nome,
      userId: student.userId,
    },
  });
}
