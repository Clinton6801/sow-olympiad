import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Get the admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Timing-safe comparison to prevent timing attacks
    // Convert strings to buffers for comparison
    const providedBuffer = Buffer.from(password || '');
    const expectedBuffer = Buffer.from(adminPassword);

    // Handle unequal lengths safely (timingSafeEqual throws if lengths differ)
    let isValid = false;
    try {
      // Only call timingSafeEqual if lengths match (constant-time comparison)
      isValid = providedBuffer.length === expectedBuffer.length && 
                timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
      // Comparison failed (this shouldn't happen if length check passes, but be safe)
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create JWT token valid for 24 hours
    const token = jwt.sign(
      { admin: true, timestamp: Date.now() },
      process.env.JWT_SECRET || 'sow-2026-dev-jwt-secret-key',
      { expiresIn: '24h' }
    );

    // Create response with httpOnly cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
