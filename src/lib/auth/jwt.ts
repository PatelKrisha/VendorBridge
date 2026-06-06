import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_key_vendorbridge_erp_2026_change_me'
);

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: 'ADMIN' | 'OFFICER' | 'APPROVER' | 'FINANCE' | 'VENDOR';
  email: string;
}

/**
 * Sign an Access Token (valid for 15 minutes)
 */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

/**
 * Verify an Access Token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Sign a Refresh Token (valid for 7 days)
 */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify a Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}
