import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token not found.' },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token.' },
        { status: 401 }
      );
    }

    // Verify user is still active in the database
    const userList = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    const user = userList[0];

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User is inactive or no longer exists.' },
        { status: 403 }
      );
    }

    const newPayload = {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
    };

    // Generate rotated tokens
    const newAccessToken = await signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken(newPayload);

    // Set new refresh token cookie
    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during token refresh.' },
      { status: 500 }
    );
  }
}
