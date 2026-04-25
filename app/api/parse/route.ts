import { NextRequest, NextResponse } from 'next/server';
import { parseWithGemini, CUSTOMER_PARSE_PROMPT, extractJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    const rawResult = await parseWithGemini(CUSTOMER_PARSE_PROMPT, text);
    const parsed = extractJSON(rawResult);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'AI 파싱 중 오류가 발생했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
