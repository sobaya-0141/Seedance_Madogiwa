function acceptsHtml(request) {
  return request.headers.get("accept")?.includes("text/html") ?? false;
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (
      response.status !== 404
      || request.method !== "GET"
      || !acceptsHtml(request)
    ) {
      return response;
    }

    const indexUrl = new URL("/index.html", request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
