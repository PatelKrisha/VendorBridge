import bcrypt from 'bcryptjs';

/**
 * Hash password with bcryptjs using 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plain text password with a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates that the password meets the ERP security policy:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one digit
 * - At least one symbol (special character)
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 12) {
    return { isValid: false, message: 'Password must be at least 12 characters long.' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }

  const hasDigit = /[0-9]/.test(password);
  if (!hasDigit) {
    return { isValid: false, message: 'Password must contain at least one digit.' };
  }

  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!hasSymbol) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }

  return { isValid: true };
}
