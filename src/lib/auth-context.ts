import { headers, cookies } from 'next/headers';
import { verifyAccessToken, JWTPayload } from './auth/jwt';

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role') as JWTPayload['role'] | null;
    const orgId = headersList.get('x-user-org-id');
    const email = headersList.get('x-user-email');

    // If headers exist from the proxy middleware, return them immediately
    if (userId && role && orgId && email) {
      return { userId, role, orgId, email };
    }

    // Fallback: Read from the access_token cookie directly (e.g., when called from inside a Server Action)
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return null;
    }

    return await verifyAccessToken(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
