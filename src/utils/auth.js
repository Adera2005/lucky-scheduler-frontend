// ============================================================
// auth.js
// Small auth utility — gets the logged-in user's ID reliably.
//
// Priority:
//   1. localStorage 'userId'  (set on login/signup)
//   2. Decode the JWT token from localStorage 'token'
//      (fallback for users who logged in before the userId
//       storage fix was deployed)
// ============================================================

/**
 * Returns the current user's ID as a string, or null if not logged in.
 */
export function getUserId() {
  // Primary: explicit storage
  const stored = localStorage.getItem('userId');
  if (stored && stored !== 'null' && stored !== 'undefined') {
    return String(stored);
  }

  // Fallback: decode JWT payload (it's just base64 — no secret needed client-side)
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload?.id) {
      // Cache it so next call is instant
      localStorage.setItem('userId', String(payload.id));
      return String(payload.id);
    }
  } catch {
    // malformed token — ignore
  }

  return null;
}
