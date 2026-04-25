import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 8; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `UMJ-${part1}-${part2}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let query = `SELECT * FROM customers`;
    const conditions: string[] = [];
    const params: (string | string[])[] = [];

    if (status && status !== '전체') {
      conditions.push(`status = $${conditions.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(customer_name ILIKE $${conditions.length + 1} OR phone ILIKE $${conditions.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY received_at DESC NULLS LAST, created_at DESC';

    const result = await sql.query(query, params);
    // sql.query returns { rows: [...] } in @neondatabase/serverless v1
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows || [];
    return NextResponse.json({ success: true, data: rows }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { error: '고객 목록을 불러올 수 없습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = generateOrderId();
    
    // KST timestamp
    const receivedAt = new Date().toISOString();

    const result = await sql`
      INSERT INTO customers (
        order_id, received_at, brand, customer_name, ssn, phone, 
        address, account, model_code, color, contract_period, 
        service_type, monthly_fee, promotion, desired_install_date, memo
      ) VALUES (
        ${orderId}, ${receivedAt}, ${body.brand || null}, ${body.customerName || null},
        ${body.ssn || null}, ${body.phone || null}, ${body.address || null},
        ${body.account || null}, ${body.modelCode || null}, ${body.color || null},
        ${body.contractPeriod || null}, ${body.serviceType || null},
        ${body.monthlyFee ? Number(body.monthlyFee) : null},
        ${body.promotion && body.promotion.length > 0 ? body.promotion : null},
        ${body.desiredInstallDate || null}, ${body.memo || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json(
      { error: '고객 등록에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
