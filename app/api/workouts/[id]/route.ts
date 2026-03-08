import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const updated = await prisma.workout.update({
    where: { id: params.id },
    data: {
      studentId: typeof body?.studentId === "string" ? body.studentId : undefined,
      objetivo: typeof body?.objetivo === "string" ? body.objetivo : undefined,
      nivel: typeof body?.nivel === "string" ? body.nivel : undefined,
      dias: body?.dias ?? undefined,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.workout.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
