import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const secret = new TextEncoder().encode(JWT_SECRET);

export async function createToken(payload: { userId: number }) {
  const token = await new jose.SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return { userId: payload.userId as number };
  } catch (error) {
    console.error('[JWT] Verification failed:', error);
    return null;
  }
}
