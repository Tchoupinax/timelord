import http from "node:http";

const remoteApi =
  process.env.TIMELORD_REMOTE_API ?? "https://crons.mysupercloud.dev/api";
const remoteOrigin = new URL(remoteApi).origin;
const listenPort = Number(process.env.OAUTH_CALLBACK_PROXY_PORT ?? "9988");

function rewriteSetCookie(value) {
  return value
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*Secure/gi, "");
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", chunk => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname !== "/callback") {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const upstreamUrl = `${remoteOrigin}/api/callback${url.search}`;
  const headers = { ...request.headers, host: new URL(remoteOrigin).host };
  delete headers.connection;
  delete headers.host;
  headers.host = new URL(remoteOrigin).host;

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await readBody(request);

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = {};
  for (const [name, value] of upstream.headers.entries()) {
    const lower = name.toLowerCase();
    if (lower === "set-cookie") {
      if (!responseHeaders["set-cookie"]) {
        responseHeaders["set-cookie"] = [];
      }
      responseHeaders["set-cookie"].push(rewriteSetCookie(value));
      continue;
    }
    if (lower === "transfer-encoding") {
      continue;
    }
    responseHeaders[name] = value;
  }

  response.writeHead(upstream.status, responseHeaders);
  response.end(Buffer.from(await upstream.arrayBuffer()));
});

server.listen(listenPort, () => {
  console.log(
    `OAuth callback proxy listening on http://localhost:${listenPort}/callback -> ${remoteOrigin}/api/callback`,
  );
});
