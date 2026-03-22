/**
 * Username Generation Utilities
 */

/**
 * Generate a unique username from email
 * Format: lowercase alphanumeric + random suffix
 */
export function generateUsername(email: string): string {
  // Extract part before @
  const localPart = email.split('@')[0]?.toLowerCase() || 'user';
  
  // Remove special characters, keep only alphanumeric
  const cleanPart = localPart.replace(/[^a-z0-9]/g, '');
  
  // Generate random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 6);
  
  // Combine and limit length
  const username = `${cleanPart || 'user'}_${suffix}`;
  
  return username.substring(0, 30);
}

/**
 * Validate username format
 * - 3-30 characters
 * - Only letters, numbers, underscores, hyphens
 */
export function isValidUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 30) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(
  db: any,
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const { eq, and } = await import('drizzle-orm');
  const { userProfile } = await import('./profile.schema');
  
  const [existing] = await db
    .select({ userId: userProfile.userId })
    .from(userProfile)
    .where(
      excludeUserId
        ? and(
            eq(userProfile.username, username),
            eq(userProfile.userId, excludeUserId)
          )
        : eq(userProfile.username, username)
    );
  
  return !existing;
}

/**
 * Generate a unique username, ensuring no collisions
 */
export async function generateUniqueUsername(
  db: any,
  email: string,
  maxAttempts: number = 5
): Promise<string> {
  let baseUsername = generateUsername(email);
  
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = i === 0 ? baseUsername : `${baseUsername}_${i}`;
    const available = await isUsernameAvailable(db, candidate);
    
    if (available) {
      return candidate;
    }
  }
  
  // Fallback with timestamp
  return `user_${Date.now().toString(36)}`;
}
