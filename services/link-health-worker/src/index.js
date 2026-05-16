const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type"
    }
});
export default {
    async fetch(request) {
        if (request.method === "OPTIONS") {
            return json({ ok: true });
        }
        const url = new URL(request.url);
        if (request.method === "GET" && url.pathname === "/api/health") {
            return json({ ok: true, service: "link-health-worker" });
        }
        if (request.method === "POST" && url.pathname === "/api/link-health/batch") {
            const body = (await request.json());
            return json({
                results: body.urls.map((rawUrl) => ({
                    url: rawUrl,
                    normalizedUrl: rawUrl.trim().toLowerCase(),
                    status: "unknown",
                    checkedAt: new Date().toISOString(),
                    source: "fresh-check"
                })),
                summary: {
                    total: body.urls.length,
                    fresh: body.urls.length,
                    cached: 0,
                    failed: 0
                }
            });
        }
        return json({ error: "Not found" }, 404);
    }
};
