module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, unit_type, purpose, message } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: '이름과 연락처는 필수입니다.' });

  /* ── 1. Supabase 저장 ── */
  const SUPABASE_URL  = 'https://rdiiekxvuljuwtfpazaz.supabase.co';
  const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkaWlla3h2dWxqdXd0ZnBhemF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDk4NjIsImV4cCI6MjA5MjI4NTg2Mn0.7moQhd--8MOGHvP4NPFOJ8rNxL7ImXdA-qNr8FIHoI0';

  const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/consultations`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      name, phone,
      unit_type: unit_type || null,
      purpose:   purpose   || null,
      message:   message   || null,
      project:   '정동 롯데캐슬 136'
    })
  });

  if (!sbRes.ok) {
    const err = await sbRes.text();
    return res.status(500).json({ error: err });
  }

  /* ── 2. Resend 이메일 알림 ── */
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['simkorea86@gmail.com'],
        subject: `[정동 롯데캐슬 136] 새 관심고객 등록 — ${name}`,
        html: `
          <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="color:#1a2340;border-bottom:2px solid #b8965a;padding-bottom:10px;margin-bottom:16px;">
              🏢 새 관심고객이 등록되었습니다
            </h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 14px;background:#f7f4f0;font-weight:700;width:30%;border:1px solid #ddd;color:#1a2340;">이름</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${name}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f7f4f0;font-weight:700;border:1px solid #ddd;color:#1a2340;">연락처</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">
                  <a href="tel:${phone}" style="color:#b8965a;font-weight:700;">${phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f7f4f0;font-weight:700;border:1px solid #ddd;color:#1a2340;">관심 타입</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${unit_type || '미선택'}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f7f4f0;font-weight:700;border:1px solid #ddd;color:#1a2340;">투자 목적</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${purpose || '미선택'}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;background:#f7f4f0;font-weight:700;border:1px solid #ddd;color:#1a2340;">문의 내용</td>
                <td style="padding:10px 14px;border:1px solid #ddd;">${message || '없음'}</td>
              </tr>
            </table>
            <p style="margin-top:20px;color:#aaa;font-size:12px;">
              정동 롯데캐슬 136 ·
              <a href="https://jeongdong-lotte136.vercel.app" style="color:#b8965a;">홈페이지 바로가기</a>
            </p>
          </div>
        `
      })
    });
  } catch (_) {}

  return res.status(200).json({ success: true });
};
