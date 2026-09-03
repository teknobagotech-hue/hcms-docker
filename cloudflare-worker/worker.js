/**
 * Cloudflare Worker for HCMS - Uploads to Cloudflare R2 Bucket ("xrays")
 *
 * Setup in Cloudflare Dashboard (Takes 2 minutes):
 * 1. Log in to dash.cloudflare.com -> Compute (Workers & Pages) -> Create application -> Create Worker
 * 2. Name your worker (e.g., "hcms-xray-uploader") and click Deploy.
 * 3. Click "Edit code", replace the default code with this file, and click "Deploy".
 * 4. Go to Worker Settings -> Variables and Secrets (or "Bindings"):
 *    - Click "Add" under "R2 Bucket Bindings"
 *    - Variable name: R2_BUCKET
 *    - R2 bucket: xrays
 *    - Click "Deploy" / "Save".
 * 5. Copy the Worker URL (e.g., https://hcms-xray-uploader.<subdomain>.workers.dev)
 *    and paste it into your HCMS .env as VITE_R2_UPLOAD_URL.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Default public development URL from your Cloudflare R2 bucket
const DEFAULT_PUBLIC_URL = 'https://pub-5069fda2b35445cb9ff06383cbcea227.r2.dev';

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);

    // 2. Health check endpoint
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'HCMS R2 Uploader',
          bucket: 'xrays',
          time: new Date().toISOString(),
        }),
        {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Handle File Upload (POST)
    if (request.method === 'POST') {
      try {
        // Resolve R2 bucket binding (find whichever candidate is an actual R2 binding with .put)
        const candidates = [env.XRAYS_BUCKET, env.R2_BUCKET, env.xrays, env.MY_BUCKET, env.BUCKET];
        const r2Bucket = candidates.find((b) => b && typeof b.put === 'function');

        if (!r2Bucket) {
          return new Response(
            JSON.stringify({
              error:
                'R2 bucket binding is missing or invalid. In Worker Settings -> Bindings, ensure your "xrays" bucket is added under "R2 Bucket Bindings" (not as a plain text environment variable).',
            }),
            {
              status: 500,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            }
          );
        }

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
          return new Response(
            JSON.stringify({ error: 'Invalid Content-Type. Must be multipart/form-data.' }),
            {
              status: 400,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            }
          );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'imaging-reports';

        if (!file || !(file instanceof File)) {
          return new Response(
            JSON.stringify({ error: 'No file provided under field "file"' }),
            {
              status: 400,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            }
          );
        }

        // Clean filename and create unique timestamped key
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueKey = `${folder}/${Date.now()}_${cleanFileName}`;

        // Upload stream directly to R2 bucket
        await r2Bucket.put(uniqueKey, file.stream(), {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
          },
        });

        // Construct public access URL
        const publicBase = (env.PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/$/, '');
        const fileUrl = `${publicBase}/${uniqueKey}`;

        return new Response(
          JSON.stringify({
            success: true,
            url: fileUrl,
            key: uniqueKey,
            fileName: file.name,
            size: file.size,
            contentType: file.type,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || 'Failed to upload to Cloudflare R2' }),
          {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
