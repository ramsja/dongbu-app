import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const finiquito = await db.finiquito.update({
      where: { id: parseInt(id) },
      data: body,
    });
    return NextResponse.json(finiquito);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar finiquito' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.finiquito.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar finiquito' }, { status: 500 });
  }
}
