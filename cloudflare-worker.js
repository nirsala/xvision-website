// Directory-index worker for Cloudflare Workers static assets (html_handling: "none").
//
// With html_handling "none", assets are served ONLY on exact path matches — which is what
// keeps every existing .html URL identical to today (200, no redirect). Those requests are
// served directly by the asset layer and never reach this code.
//
// This worker only runs when no asset matches, and restores the standard static-host behavior:
//   1. "/" or "/blog/"      -> serve "<path>index.html"
//   2. "/blog" (no ext)     -> 301 to "/blog/" when a directory index exists (GitHub Pages/Render parity)
//   3. anything else        -> 404 (uses /404.html if the site has one)

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
  let stored = false;
  if (env.LEADS_DB) {
    try {
      await env.LEADS_DB.prepare(
        "CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, at TEXT, source TEXT, data TEXT)"
      ).run();
      await env.LEADS_DB.prepare("INSERT INTO leads (id, at, source, data) VALUES (?1, ?2, ?3, ?4)")
        .bind(lead.id, lead.at, lead._source, JSON.stringify(lead)).run();
      stored = true;
    } catch (e) { stored = false; }
  }
  if (env.LEADS) {
    try {
      await env.LEADS.put("lead:" + lead.at + ":" + lead.id, JSON.stringify(lead));
      stored = true;
    } catch (e) { /* keep D1 result */ }
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
          from: env.LEAD_FROM || "onboarding@resend.dev",
          to: ["nirsala@gmail.com"],
          reply_to: lead["אימייל"] || undefined,
          subject,
          html: '<div dir="rtl" style="font-family:Arial,sans-serif"><table style="border-collapse:collapse">' + rows + "</table></div>",
        }),
      });
      mailed = r.ok;
    } catch (e) { mailed = false; }
  }

  // Neither stored nor mailed -> real failure; the browser falls back to formsubmit and, failing that, #form-error.
  if (!stored && !mailed) return json({ success: false, stored, mailed }, 502);
  return json({ success: true, id: lead.id, stored, mailed }, 200);
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
  return json({ count: out.length, leads: out });
}
