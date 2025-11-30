import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint für Docker Health Checks
 * GET /health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'sharelocal-web',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

