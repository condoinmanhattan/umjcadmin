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

  const text = `lg정수기

김경옥 1995년 01월 06일 010 6555 1585
(42237) 대구 수성구 파동로 47 (파동, 수성 해모로 하이엔) 111동 902호
   
302-1419-903531 농협은행

WD520ACB 자가관리_LG케어
72개월   27,900 원 프로모션 ㅣ 1년간 6천원 할인

특이사항 : 결제일 21일~25일 사이 원함`;

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
