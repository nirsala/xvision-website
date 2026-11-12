// Directory-index worker for Cloudflare Workers static assets (html_handling: "none").
//
// With html_handling "none", assets are served ONLY on exact path matches — which is what
// keeps every existing .html URL identical to today (200, no redirect). Those requests are
// served directly by the asset layer and never reach this code.
//
// This worker only runs when no asset matches, and restores the standard static-host behavior:
//   1. "/" or "/blog/"      -> serve "<path>index.html"
//   2. "/blog" (no ext)     -> 301 to "/blog/" when a directory index exists (GitHub Pages/Render parity)
//   3. anything else        -> 404 (uses /404.html if the site has one; Markdown when Accept asks for it)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Lead intake (T093, Nir 5.11): store first, then notify. Runs here because no asset matches /api/*.
    if (pathname === "/api/lead") {
      if (request.method === "POST") return handleLead(request, env);
      return json({ success: false, error: "method" }, 405);
    }
    if (pathname === "/api/leads" && request.method === "GET") {
      return listLeads(request, env);
    }

    if (pathname.endsWith("/")) {
      // Directory index: /foo/ -> /foo/index.html
      const indexUrl = new URL(url);
      indexUrl.pathname = pathname + "index.html";
      const res = await env.ASSETS.fetch(new Request(indexUrl, request));
      if (res.status !== 404) return res;
    } else {
      // Extensionless path: /foo -> /foo/ if /foo/index.html exists
      const lastSegment = pathname.split("/").pop();
      if (!lastSegment.includes(".")) {
        const probeUrl = new URL(url);
        probeUrl.pathname = pathname + "/index.html";
        const probe = await env.ASSETS.fetch(probeUrl.toString());
        if (probe.status !== 404) {
          const dest = new URL(url);
          dest.pathname = pathname + "/";
          return Response.redirect(dest.toString(), 301);
        }
      }
    }

    // Not found + agent asked for Markdown (Accept: text/markdown, Is Agentic, Nir 10.11):
    // a short Markdown 404 that points the agent to the right entry points. Browsers never send
    // text/markdown, so the HTML 404 below is unchanged for people.
    if (wantsMarkdown(request)) {
      return new Response(markdown404(pathname), {
        status: 404,
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "cache-control": "no-store",
          vary: "Accept",
        },
      });
    }

    // Not found — serve the site's 404 page when available, else plain 404
    const nfUrl = new URL(url);
    nfUrl.pathname = "/404.html";
    const nf = await env.ASSETS.fetch(nfUrl.toString());
    if (nf.status !== 404) {
      return new Response(nf.body, {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
};

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const LEAD_FIELDS = ["שם מלא", "טלפון", "חברה", "אימייל", "פרטי הפרויקט", "הסכמה_לדיוור", "מקור_הפנייה"];

async function handleLead(request, env) {
  let f;
  try { f = await request.formData(); } catch (e) { return json({ success: false, error: "body" }, 400); }
  const get = (k) => (f.get(k) || "").toString().trim().slice(0, 4000);

  const lead = { id: crypto.randomUUID(), at: new Date().toISOString() };
  for (const k of LEAD_FIELDS) lead[k] = get(k);
  // Keep every other text field too (e.g. the Pixel Care form: עיר, סוג המסך, יצרן). Files are not stored.
  for (const [k, v] of f.entries()) {
    if (typeof v === "string" && !k.startsWith("_") && !(k in lead) && Object.keys(lead).length < 40) {
      lead[k] = v.trim().slice(0, 4000);
    }
  }
  lead["הסכמה_לדיוור"] = lead["הסכמה_לדיוור"] === "כן" ? "כן" : "לא";
  lead._source = get("_source") || "website";
  lead.page = get("_page") || (request.headers.get("referer") || "");
  lead.ua = request.headers.get("user-agent") || "";
  lead.ip = request.headers.get("cf-connecting-ip") || "";

  if (!lead["שם מלא"] || !lead["טלפון"]) return json({ success: false, error: "required" }, 400);

  // 1) Store first. A lead that is stored is never lost, even if every mail path fails.
  // Every failure is recorded in `diag` (returned to the browser and logged) — on 10.11 a test lead
  // reached the mailbox but not KV, and the old silent catch{} left no trace of why.
  let stored = false;
  const diag = { kv: !!env.LEADS, d1: !!env.LEADS_DB, resend: !!env.RESEND_API_KEY };
  if (env.LEADS_DB) {
    try {
      await env.LEADS_DB.prepare(
        "CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, at TEXT, source TEXT, data TEXT)"
      ).run();
      await env.LEADS_DB.prepare("INSERT INTO leads (id, at, source, data) VALUES (?1, ?2, ?3, ?4)")
        .bind(lead.id, lead.at, lead._source, JSON.stringify(lead)).run();
      stored = true;
    } catch (e) { diag.d1_error = String(e && e.message || e).slice(0, 300); }
  }
  if (env.LEADS) {
    try {
      await env.LEADS.put("lead:" + lead.at + ":" + lead.id, JSON.stringify(lead));
      diag.kv_ok = true;
      stored = true;
    } catch (e) { diag.kv_error = String(e && e.message || e).slice(0, 300); }
  }

  // 2) Mail — only when a provider key exists. Without it the browser also sends the formsubmit copy.
  let mailed = false;
  if (env.RESEND_API_KEY) {
    const esc = (v) => String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const isTest = lead._source === "heartbeat";
    const subject = isTest
      ? "בדיקת תקינות טופס — לא ליד"
      : "פנייה חדשה מהאתר — " + lead["שם מלא"] + " — " + lead["טלפון"];
    const extra = Object.keys(lead).filter((k) => !LEAD_FIELDS.includes(k) &&
      !["id", "at", "_source", "page", "ua", "ip"].includes(k));
    const rows = LEAD_FIELDS.concat(extra).map((k) => [k, lead[k]])
      .concat([["עמוד", lead.page], ["מזהה פנייה", lead.id], ["זמן", lead.at], ["נשמר", stored ? "כן" : "לא"]])
      .map(([k, v]) => '<tr><th align="right" style="padding:6px 10px;background:#f5f5f5">' + esc(k) +
        '</th><td style="padding:6px 10px">' + esc(v || "—") + "</td></tr>").join("");
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          // xvision.co.il is Verified in Resend (Nir, 10.11). onboarding@resend.dev only delivers to the account owner.
          from: env.LEAD_FROM || "Pixel by Keshet <leads@xvision.co.il>",
          to: ["nirsala@gmail.com"],
          reply_to: lead["אימייל"] || undefined,
          subject,
          html: '<div dir="rtl" style="font-family:Arial,sans-serif"><table style="border-collapse:collapse">' + rows + "</table></div>",
        }),
      });
      mailed = r.ok;
      if (!r.ok) diag.mail_error = "resend " + r.status + ": " + (await r.text().catch(() => "")).slice(0, 300);
    } catch (e) { mailed = false; diag.mail_error = String(e && e.message || e).slice(0, 300); }
  }

  // Neither stored nor mailed -> real failure; the browser falls back to formsubmit and, failing that, #form-error.
  if (!stored || diag.mail_error) console.error("lead " + lead.id + " " + JSON.stringify(diag));
  if (!stored && !mailed) return json({ success: false, stored, mailed, diag }, 502);
  return json({ success: true, id: lead.id, stored, mailed, diag }, 200);
}

async function listLeads(request, env) {
  const token = new URL(request.url).searchParams.get("key") || "";
  if (!env.LEADS_READ_TOKEN || token !== env.LEADS_READ_TOKEN) return new Response("Forbidden", { status: 403 });
  const out = [];
  if (env.LEADS) {
    const list = await env.LEADS.list({ prefix: "lead:" });
    for (const k of list.keys) {
      const v = await env.LEADS.get(k.name);
      if (v) out.push(JSON.parse(v));
    }
  }
  // Bindings as the live worker sees them — answers "is KV attached?" without dashboard access.
  return json({
    count: out.length,
    bindings: { kv: !!env.LEADS, d1: !!env.LEADS_DB, resend: !!env.RESEND_API_KEY, from: env.LEAD_FROM || "leads@xvision.co.il" },
    leads: out,
  });
}

// True only when the client explicitly ranks text/markdown at least as high as text/html.
function wantsMarkdown(request) {
  const accept = (request.headers.get("accept") || "").toLowerCase();
  if (!accept.includes("text/markdown")) return false;
  const q = (type) => {
    for (const part of accept.split(",")) {
      const [t, ...params] = part.trim().split(";");
      if (t.trim() !== type) continue;
      const qp = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return qp ? parseFloat(qp.slice(2)) || 0 : 1;
    }
    return -1;
  };
  return q("text/markdown") >= q("text/html");
}

function markdown404(pathname) {
  let path = pathname;
  try { path = decodeURIComponent(pathname); } catch (e) { /* keep raw */ }
  return [
    "# 404 — הדף לא נמצא",
    "",
    "הכתובת `" + path.replace(/`/g, "") + "` אינה קיימת ב-xvision.co.il (Pixel by Keshet — מסכי LED ושילוט דיגיטלי לעסקים).",
    "",
    "## לאן להמשיך",
    "",
    "- [דף הבית](https://xvision.co.il/)",
    "- [מסכי לד לעסקים — מחירון ומדריך](https://xvision.co.il/מסכי-לד-לעסקים.html)",
    "- [מחירי מסכי LED](https://xvision.co.il/מחירי-מסכי-led.html)",
    "- [בלוג ומדריכים](https://xvision.co.il/blog/)",
    "- [Pixel CMS — ניהול תוכן בענן](https://dds.xvision.co.il/)",
    "- [llms.txt — תקציר האתר לסוכני AI](https://xvision.co.il/llms.txt)",
    "- [sitemap.xml](https://xvision.co.il/sitemap.xml)",
    "",
    "## יצירת קשר",
    "",
    "- טלפון: *9555",
    "- וואטסאפ: +972-55-973-2343",
    "",
  ].join("\n");
}
