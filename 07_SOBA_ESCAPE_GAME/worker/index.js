export default {
  async fetch(request, env) {
    const assets = env?.ASSETS;
    if (!assets || typeof assets.fetch !== "function") {
      return new Response("Static asset binding is unavailable.", { status: 503 });
    }
    const response = await assets.fetch(request);
    if (response.status !== 404) return response;
    const url = new URL(request.url);
    url.pathname = "/index.html";
    return assets.fetch(new Request(url, request));
  },
};
