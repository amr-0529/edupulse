/** Only the two application-owned callback destinations are supported. */
export function authCallbackPath(
  next: string | null,
  success: boolean
): string {
  if (next === "/reset-password") {
    return success
      ? "/reset-password"
      : "/forgot-password?error=expired";
  }

  return success
    ? "/login?verified=1"
    : "/login?error=verification";
}