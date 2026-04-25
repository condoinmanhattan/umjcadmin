import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { ids, action, status } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '선택된 항목이 없습니다.' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      const placeholders = ids.map((_: string, i: number) => `$${i + 1}`).join(', ');
      await sql.query(`DELETE FROM customers WHERE id IN (${placeholders})`, ids);
      return NextResponse.json({ success: true, message: `${ids.length}건 삭제 완료` });
    }

    if (action === 'updateStatus' && status) {
      const placeholders = ids.map((_: string, i: number) => `$${i + 1}`).join(', ');
      await sql.query(
        `UPDATE customers SET status = $${ids.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`,
        [...ids, status]
      );
      return NextResponse.json({ success: true, message: `${ids.length}건 상태 변경 완료` });
    }

    return NextResponse.json({ error: '유효하지 않은 action입니다.' }, { status: 400 });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: '일괄 처리에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
