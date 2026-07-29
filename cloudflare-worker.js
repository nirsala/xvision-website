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
