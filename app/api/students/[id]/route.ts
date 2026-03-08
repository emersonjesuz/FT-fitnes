import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(senha: string): string {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const senhaRaw =
    typeof body?.senha === "string" && body.senha.trim() && body.senha !== "••••••"
      ? body.senha.trim()
      : undefined;

  const updated = await prisma.student.update({
    where: { id: params.id },
    data: {
      nome: typeof body?.nome === "string" ? body.nome : undefined,
      biotipo: typeof body?.biotipo === "string" ? body.biotipo : undefined,
      idade: typeof body?.idade === "number" ? body.idade : undefined,
      altura: typeof body?.altura === "number" ? body.altura : undefined,
      peso: typeof body?.peso === "number" ? body.peso : undefined,
      observacoes: typeof body?.observacoes === "string" ? body.observacoes : null,
      historicoPeso: body?.historicoPeso ?? undefined,
      ...(senhaRaw ? { senha: hashPassword(senhaRaw) } : {}),
    },
  });

  return NextResponse.json({ ...updated, senha: updated.senha ? "••••••" : null });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
