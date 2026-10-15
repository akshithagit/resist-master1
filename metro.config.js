const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Ensure .env is available to Metro server process
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const auth0Domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN || 'dev-m66oxx8o52l3edzx.us.auth0.com';
const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const proxyMiddleware = (req, res, next) => {
      // PDFKit PDF Generation Endpoint
      if (req.url && req.url.startsWith('/api/generate-pdf')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const bodyBuffer = Buffer.concat(chunks);
            const analysis = bodyBuffer.length > 0 ? JSON.parse(bodyBuffer.toString('utf8')) : {};
            const { generateAMRPDFBuffer } = require('./src/services/pdfReportGenerator');
            const pdfBuffer = await generateAMRPDFBuffer(analysis);

            const filename = `Resist_Report_${(analysis.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
            res.writeHead(200, {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': pdfBuffer.length,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': '*',
            });
            res.end(pdfBuffer);
          } catch (err) {
            res.writeHead(500, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ error: 'PDF generation failed', message: err.message }));
          }
        });
        return;
      }

      // Intercept calls to /auth0-proxy to avoid cross-origin CORS limitations in web browsers
      if (req.url && req.url.startsWith('/auth0-proxy')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const targetPath = req.url.replace(/^\/auth0-proxy/, '');
        const targetUrl = `https://${auth0Domain}${targetPath}`;

        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const bodyBuffer = Buffer.concat(chunks);
            const headers = {
              'Content-Type': req.headers['content-type'] || 'application/json',
            };
            if (req.headers['authorization']) {
              headers['Authorization'] = req.headers['authorization'];
            }

            let bodyToSend = bodyBuffer;
            if (targetPath === '/oauth/token' && bodyBuffer.length > 0) {
              try {
                const parsedBody = JSON.parse(bodyBuffer.toString('utf8'));
                if (process.env.AUTH0_CLIENT_SECRET && !parsedBody.client_secret) {
                  parsedBody.client_secret = process.env.AUTH0_CLIENT_SECRET;
                }
                // Ensure realm grant type is configured for Username-Password-Authentication connection
                parsedBody.grant_type = 'http://auth0.com/oauth/grant-type/password-realm';
                parsedBody.realm = 'Username-Password-Authentication';
                parsedBody.scope = parsedBody.scope || 'openid profile email';
                bodyToSend = Buffer.from(JSON.stringify(parsedBody), 'utf8');
              } catch (e) {}
            }

            const fetchOpts = {
              method: req.method,
              headers,
            };
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && bodyToSend.length > 0) {
              fetchOpts.body = bodyToSend;
            }

            const auth0Res = await fetch(targetUrl, fetchOpts);
            const responseData = await auth0Res.arrayBuffer();

            res.writeHead(auth0Res.status, {
              'Content-Type': auth0Res.headers.get('content-type') || 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
              'Access-Control-Allow-Headers': '*',
            });
            res.end(Buffer.from(responseData));
          } catch (err) {
            res.writeHead(500, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ error: 'Auth0 proxy failed', message: err.message }));
          }
        });
        return;
      }

      if (originalEnhanceMiddleware) {
        return originalEnhanceMiddleware(metroMiddleware, server)(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };

    return proxyMiddleware;
  },
};

module.exports = config;
