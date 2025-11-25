import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nex API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: '/api/openapi',
          dom_id: '#swagger-ui'
        })
      }
    </script>
  </body>
</html>`

export async function GET() {
  const start = Date.now()
  metrics.recordResponse('/api/docs', Date.now() - start)
  return new NextResponse(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
