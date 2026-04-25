import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await sql`SELECT * FROM customers WHERE id = ${id}`;
    if (result.length === 0) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { error: '고객 조회에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}

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

    const allowedFields: Record<string, string> = {
      brand: 'brand',
      customerName: 'customer_name',
      ssn: 'ssn',
      phone: 'phone',
      address: 'address',
      account: 'account',
      modelCode: 'model_code',
      color: 'color',
      contractPeriod: 'contract_period',
      serviceType: 'service_type',
      monthlyFee: 'monthly_fee',
      promotion: 'promotion',
      desiredInstallDate: 'desired_install_date',
      scheduledInstallDate: 'scheduled_install_date',
      status: 'status',
      memo: 'memo',
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        let val = body[key];
        // Coerce value types
        if (key === 'monthlyFee') {
          val = val !== '' && val !== null ? Number(String(val).replace(/,/g, '')) : null;
        } else if (key === 'promotion') {
          val = Array.isArray(val) && val.length > 0 ? val : null;
        } else if (typeof val === 'string' && val.trim() === '') {
          val = null;
        }
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const result = await sql.query(query, values);
    // sql.query returns { rows: [...] } in @neondatabase/serverless v1
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows || [];

    if (rows.length === 0) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Customer PATCH error:', error);
    return NextResponse.json(
      { error: '고객 수정에 실패했습니다.', detail: String(error) },
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
    const result = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json(
      { error: '고객 삭제에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
