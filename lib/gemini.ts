import { GoogleGenerativeAI } from '@google/generative-ai';

let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel() {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return _model;
}

export const CUSTOMER_PARSE_PROMPT = `다음 텍스트에서 렌탈 고객 정보를 추출해 JSON으로 반환하라. 
해당 없는 필드는 null로 처리하고, 아래 규칙을 따른다:

중요: 모든 값은 원본 텍스트의 한국어를 그대로 유지하라. 번역하지 마라.
- 주소는 한국어 그대로 (예: "서울시 강남구" → "서울시 강남구", 영어로 번역 금지)
- 은행명은 한국어 그대로 (예: "우리은행" → "우리은행", 영어로 번역 금지)
- 색상은 한국어 그대로 (예: "화이트" → "화이트")
- 고객명은 한국어 그대로

- brand: 제조사명 (쿠쿠/코웨이/청호/LG/삼성 등)
- customerName: 고객명
- ssn: 주민번호 앞 7자리 (예: 990909-1, 성별코드 포함)
  * 생년월일이 있으면: YYMMDD-성별코드 형식
  * 성별코드: 1900년대생 남=1 여=2, 2000년대생 남=3 여=4
- phone: 휴대폰번호 (010-XXXX-XXXX 형식으로 정규화)
- address: 전체 주소 (기본주소 + 상세주소 합치기, 한국어 그대로)
- account: 계좌 또는 카드 정보 (은행명 + 계좌번호 그대로, 한국어 유지)
- modelCode: 모델 코드 (괄호 안 영문+숫자 코드, 예: CP-AQS100EWH, BA36-B)
- color: 색상 (한국어 그대로, 없으면 null)
- contractPeriod: 의무기간 (예: 7년, 6년, 3년)
- serviceType: 관리유형 (예: 자가관리, 4개월 방문관리, 방문관리)
- monthlyFee: 월 렌탈료 숫자만 (카드할인가 아닌 원래 월 렌탈료 기준)
- promotion: 프로모션 ["반값할인","타사보상","결합할인"] 중 해당되는 것 배열로. 
  "반값"이나 "프로모션" 언급 있으면 반값할인 포함.
- desiredInstallDate: 설치희망일 (YYYY-MM-DD 또는 텍스트 그대로)
- memo: 고객메모 또는 특이사항
  * 단, 다음 문구는 메모에서 반드시 제외하라: "법인 또는 사업자명의 신청시 서류첨부"
  * 해당 문구가 포함된 줄은 무시하고, 나머지 특이사항만 memo에 넣어라.

반드시 JSON만 반환하고 다른 텍스트 없이.`;

export const INTENT_CLASSIFY_PROMPT = `아래 텍스트가 다음 중 무엇인지 판단하고 JSON으로 반환:
- "customer_register": 렌탈 고객 등록 정보 (모델명, 고객명, 주소 등 포함)
- "db_register": 연락처/DB 등록 (전화번호 위주, 고객 정보 없음)

{ "intent": "customer_register" | "db_register" }만 반환.`;

export async function parseWithGemini(systemPrompt: string, userText: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userText }
  ]);
  return result.response.text();
}

export function extractJSON(text: string): Record<string, unknown> {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text.trim());
}
