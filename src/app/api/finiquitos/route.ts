import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const finiquitos = await db.finiquito.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(finiquitos);
  } catch {
    return NextResponse.json({ error: 'Error al obtener finiquitos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const finiquito = await db.finiquito.create({ data: body });
    return NextResponse.json(finiquito, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear finiquito' }, { status: 500 });
  }
}
