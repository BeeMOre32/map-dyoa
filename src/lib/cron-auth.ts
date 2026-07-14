/** Vercel Cron · CRON_SECRET Bearer 검증 */

export function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === 'development';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
