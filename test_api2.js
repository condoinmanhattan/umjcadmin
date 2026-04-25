async function run() {
  const secret = 'umjc-rental-2026';
  const message = 'admin_login_success';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const token = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const text = `렌탈상품 정보
상품정보	렌탈기간	월 렌탈료	카드할인가	수량
	
청호 얼음냉온정수기 OMNi Plus (OATMEAL BEIGE) (WI-53C9600M) 4개월 방문관리

청호나이스

5년(5년의무)	월 31,900 원	월 1,900 원	1 개
렌탈고객 정보
고객명*	
이충환
휴대폰*	
010 - 5193 - 7156
전화번호	
주소*	
우편번호 14127

경기 안양시 동안구 경수대로498번길 107 (호계동, 금호아파트)
상세주소 602호

생년월일*	
1981 년 02 월 27 일
남
설치희망일	
2026-05-02
고객메모	
국민은행 171 21 0254 857
법인 또는 사업자명의 신청시 서류첨부`;

  const res = await fetch('http://localhost:3000/api/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth_token=${token}`
    },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
