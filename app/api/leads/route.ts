import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let result;
    if (status === '상담대기') {
      // Also match legacy '상담전' and NULL values
      result = await sql`SELECT * FROM db_leads WHERE status = ${status} OR status = '상담전' OR status IS NULL ORDER BY created_at DESC`;
    } else if (status === '팔로업') {
      // Also match legacy '2차상담완료'
      result = await sql`SELECT * FROM db_leads WHERE status = ${status} OR status = '2차상담완료' ORDER BY created_at DESC`;
    } else if (status) {
      result = await sql`SELECT * FROM db_leads WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      result = await sql`SELECT * FROM db_leads ORDER BY created_at DESC`;
    }
    const mappedData = result.map((lead: any) => {
      let mappedStatus = lead.status;
      if (!mappedStatus || mappedStatus === '상담전') {
        mappedStatus = '상담대기';
      } else if (mappedStatus === '2차상담완료') {
        mappedStatus = '팔로업';
      }
      return { ...lead, status: mappedStatus };
    });
    return NextResponse.json({ success: true, data: mappedData }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: '잠재고객 목록을 불러올 수 없습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.phone) {
      return NextResponse.json(
        { error: '전화번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // Auto-format phone number: 01056565656 → 010-5656-5656
    let phone = body.phone.replace(/[^0-9]/g, '');
    if (phone.length === 11 && phone.startsWith('010')) {
      phone = `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    } else if (phone.length === 10 && phone.startsWith('02')) {
      phone = `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
    } else if (phone.length === 10) {
      phone = `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }

    const status = body.status || '상담완료';

    const result = await sql`
      INSERT INTO db_leads (phone, customer_name, memo, status)
      VALUES (${phone}, ${body.customerName || null}, ${body.memo || null}, ${status})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json(
      { error: '잠재고객 등록에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
