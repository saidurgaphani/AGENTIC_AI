import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_TARGET = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function proxyToFastAPI(req: NextRequest, targetPath: string): Promise<NextResponse> {
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const targetUrl = `${FASTAPI_TARGET}${cleanPath}${req.nextUrl.search}`;
  const method = req.method;

  const proxyHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'connection') {
      proxyHeaders.set(key, value);
    }
  });

  let body: ArrayBuffer | undefined = undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    try {
      body = await req.clone().arrayBuffer();
    } catch {
      // Empty body
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: proxyHeaders,
      body,
      // 60-second timeout for long-running OR-Tools multi-agent optimizations
      signal: AbortSignal.timeout(60000),
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      responseHeaders.set(key, val);
    });
    responseHeaders.set('x-authoritative-backend', 'FastAPI-Neon');

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: isTimeout ? 'BACKEND_TIMEOUT' : 'BACKEND_UNAVAILABLE',
          message: isTimeout
            ? 'The optimization backend request timed out after 60 seconds.'
            : `Authoritative FastAPI backend is unavailable at ${FASTAPI_TARGET}. Ensure uvicorn backend service is running.`,
          details: error.message,
        },
      },
      { status: isTimeout ? 504 : 503 }
    );
  }
}
