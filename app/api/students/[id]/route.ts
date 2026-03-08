import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

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
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
