import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const contrato = await db.contrato.update({
      where: { id: parseInt(id) },
      data: body,
    });
    return NextResponse.json(contrato);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.contrato.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 });
  }
}
