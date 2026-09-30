import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default async function handler(req, res) {
  const backendBase = process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:5000';
  const pathParts = req.query.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  // Extract query string directly from req.url
  const urlObj = new URL(req.url, 'http://localhost');
  const query = urlObj.search;

  const targetUrl = `${backendBase}/api/${subPath}${query}`;

  try {
    const upstream = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: undefined
      },
      data: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      responseType: 'stream',
      validateStatus: () => true
    });

    res.status(upstream.status);
    for (const [key, val] of Object.entries(upstream.headers)) {
      res.setHeader(key, val);
    }
    upstream.data.pipe(res);
  } catch (error) {
    console.error('API Gateway Proxy Error:', error.message);
    res.status(502).json({
      success: false,
      error: 'Backend gateway error: could not reach internal API service',
      target: targetUrl
    });
  }
}
