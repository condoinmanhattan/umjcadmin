import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import {
  parseWithGemini,
  CUSTOMER_PARSE_PROMPT,
  INTENT_CLASSIFY_PROMPT,
  extractJSON,
} from '@/lib/gemini';

function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 8; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `UMJ-${part1}-${part2}`;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Step 1: Classify intent
    const intentRaw = await parseWithGemini(INTENT_CLASSIFY_PROMPT, text);
    const intentResult = extractJSON(intentRaw) as { intent: string };
    const intent = intentResult.intent;

    if (intent === 'customer_register') {
      // Step 2a: Parse customer data
      const parseRaw = await parseWithGemini(CUSTOMER_PARSE_PROMPT, text);
      const parsed = extractJSON(parseRaw) as Record<string, unknown>;
      const orderId = generateOrderId();
      const receivedAt = new Date().toISOString();

      const result = await sql`
        INSERT INTO customers (
          order_id, received_at, brand, customer_name, ssn, phone,
          address, account, model_code, color, contract_period,
          service_type, monthly_fee, promotion, desired_install_date, memo
        ) VALUES (
          ${orderId}, ${receivedAt},
          ${(parsed.brand as string) || null}, ${(parsed.customerName as string) || null},
          ${(parsed.ssn as string) || null}, ${(parsed.phone as string) || null},
          ${(parsed.address as string) || null}, ${(parsed.account as string) || null},
          ${(parsed.modelCode as string) || null}, ${(parsed.color as string) || null},
          ${(parsed.contractPeriod as string) || null}, ${(parsed.serviceType as string) || null},
          ${parsed.monthlyFee ? Number(parsed.monthlyFee) : null},
          ${parsed.promotion && Array.isArray(parsed.promotion) && (parsed.promotion as string[]).length > 0 ? (parsed.promotion as string[]) : null},
          ${(parsed.desiredInstallDate as string) || null}, ${(parsed.memo as string) || null}
        )
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        type: 'customer_register',
        data: result[0],
      });
    } else if (intent === 'db_register') {
      // Step 2b: Extract phone number from text
      const phoneMatch = text.match(/01[016789]-?\d{3,4}-?\d{4}/);
      const phone = phoneMatch
        ? phoneMatch[0].replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
        : text.trim();

      const result = await sql`
        INSERT INTO db_leads (phone, memo)
        VALUES (${phone}, ${text})
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        type: 'db_register',
        data: result[0],
      });
    }

    return NextResponse.json(
      { error: '의도를 파악할 수 없습니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('OpenClaw error:', error);
    return NextResponse.json(
      { error: 'OpenClaw 처리 중 오류가 발생했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
