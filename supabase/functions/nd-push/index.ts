// NEWS DESK 푸시 알림 발송 함수 (pg_cron이 10분마다 호출)
// - 처음 실행될 때 VAPID 서명 열쇠를 만들어 Vault에 넣는다(비밀 열쇠는 서버 밖으로 나가지 않음)
// - 보낼 시간이 된 구독(nd_push_due)에 알림을 보내고, 만료된 구독(404/410)은 지운다
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SUBJECT = "https://greenneeg-sketch.github.io/news-desk-idle/";
const MSG: Record<string, { title: string; body: string }> = {
  offline: { title: "NEWS DESK", body: "야간 근무 수익이 가득 찼어요! 보도국으로 돌아와 받아 가세요." },
};

async function vapid() {
  const { data } = await sb.rpc("nd_vapid");
  if (data && data.public && data.private) return data as { public: string; private: string };
  const k = webpush.generateVAPIDKeys();
  await sb.rpc("nd_vapid_init", { p_public: k.publicKey, p_private: k.privateKey });
  const { data: d2 } = await sb.rpc("nd_vapid");
  return d2 as { public: string; private: string };
}

Deno.serve(async (req) => {
  try {
    const v = await vapid();
    webpush.setVapidDetails(SUBJECT, v.public, v.private);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (body && body.init) return Response.json({ ok: true, public: v.public });
    const { data: due, error } = await sb.rpc("nd_push_due");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    let sent = 0, gone = 0, failed = 0;
    const errs: string[] = [];
    for (const d of due ?? []) {
      try {
        await webpush.sendNotification(d.sub, JSON.stringify(MSG[d.kind] ?? MSG.offline), { TTL: 6 * 3600 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { await sb.rpc("nd_push_gone", { p_id: d.id }); gone++; }
        else { failed++; errs.push(String(code ?? (e as Error).message).slice(0, 120)); }
      }
    }
    return Response.json({ due: (due ?? []).length, sent, gone, failed, errs });
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
});
