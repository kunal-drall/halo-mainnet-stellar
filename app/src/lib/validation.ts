/**
 * Input validation utilities for API routes.
 * Centralized validation logic for common input patterns.
 */

/**
 * Validate a Stellar public key format (G... 56 chars).
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Validate a circle invite code format (alphanumeric, 8 chars).
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Validate contribution amount (positive number, max 7 decimals for Stellar).
 */
export function isValidAmount(amount: number): boolean {
  if (typeof amount !== "number" || isNaN(amount)) return false;
  if (amount <= 0) return false;
  // Stellar supports up to 7 decimal places
  const decimals = amount.toString().split(".")[1];
  if (decimals && decimals.length > 7) return false;
  return true;
}

/**
 * Sanitize a string for safe storage (trim, limit length).
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Validate circle name.
 */
export function isValidCircleName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
