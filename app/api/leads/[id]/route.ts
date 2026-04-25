import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(body.phone);
    }
    if (body.customerName !== undefined) {
      fields.push(`customer_name = $${paramIndex++}`);
      values.push(body.customerName);
    }
    if (body.memo !== undefined) {
      fields.push(`memo = $${paramIndex++}`);
      values.push(body.memo);
    }
    if (body.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE db_leads SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await sql.query(query, values);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows || [];

    if (rows.length === 0) {
      return NextResponse.json({ error: '잠재고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Lead PATCH error:', error);
    return NextResponse.json(
      { error: '잠재고객 수정에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await sql`DELETE FROM db_leads WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: '잠재고객을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead DELETE error:', error);
    return NextResponse.json(
      { error: '잠재고객 삭제에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
