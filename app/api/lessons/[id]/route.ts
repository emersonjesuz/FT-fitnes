import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const nome = String(body?.nome || "").trim();
  const videoUrl = String(body?.videoUrl || "").trim();

  if (!nome || !videoUrl) {
    return NextResponse.json(
      { message: "nome e videoUrl são obrigatórios" },
      { status: 400 }
    );
  }

  const lesson = await prisma.lesson.update({
    where: { id: params.id },
    data: { nome, videoUrl },
  });

  return NextResponse.json(lesson);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
