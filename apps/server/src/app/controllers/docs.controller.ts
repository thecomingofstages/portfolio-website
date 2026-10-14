/**
 * Swagger UI for swagger.yaml (the hand-written OpenAPI file at the server root).
 *
 * The UI comes from a pinned CDN version: Workers have no disk to serve
 * swagger-ui-dist from. Its own Content-Security-Policy allows only that CDN path.
 */
import type { RequestHandler } from "express";
import swaggerYaml from "../../../swagger.yaml";

const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TCOS API docs</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="/api/docs/init.js"></script>
</body>
</html>`;

// In its own file so the CSP needs no 'unsafe-inline' for scripts.
const init = `window.ui = SwaggerUIBundle({
  url: "/api/openapi.yaml",
  dom_id: "#swagger-ui",
  deepLinking: true,
  // Do not keep a pasted admin token in localStorage.
  persistAuthorization: false
});`;

const csp = [
  "default-src 'none'",
  `script-src 'self' ${SWAGGER_UI}/`,
  `style-src ${SWAGGER_UI}/ 'unsafe-inline'`,
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export const DocsController = {
  page: ((_req, res) => {
    res.set("Content-Security-Policy", csp).type("html").send(page);
  }) satisfies RequestHandler,

  init: ((_req, res) => {
    res.type("application/javascript").send(init);
  }) satisfies RequestHandler,

  spec: ((_req, res) => {
    res.type("application/yaml").send(swaggerYaml);
  }) satisfies RequestHandler,
};
