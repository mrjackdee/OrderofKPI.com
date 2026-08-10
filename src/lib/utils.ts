import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyError(err: any, defaultMsg = "An unexpected error occurred. Please try again."): string {
  if (!err) return defaultMsg;
  const raw = typeof err === 'string' ? err : (err.message || String(err));
  const lower = raw.toLowerCase();
  
  if (lower.includes('invalid-credential') || lower.includes('wrong-password') || lower.includes('user-not-found') || lower.includes('invalid credential') || lower.includes('auth/invalid-credential')) {
    return "Invalid email address or password. Please verify your credentials and try again.";
  }
  if (lower.includes('missing or insufficient permissions') || lower.includes('permission-denied')) {
    return "You do not have permission to perform this action. Please check your account role.";
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('net::err')) {
    return "Network connection issue detected. Please check your connection and try again.";
  }
  if (lower.includes('json') || lower.includes('syntaxerror') || lower.includes('unexpected token')) {
    return "Unable to process server response. Please try again later.";
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return "The request took too long to complete. Please try again.";
  }
  if (lower.includes('email-already-in-use')) {
    return "This email address is already associated with another account.";
  }
  
  if (
    lower.includes('typeerror') ||
    lower.includes('referenceerror') ||
    lower.includes('syntaxerror') ||
    lower.includes('at ') ||
    lower.includes('eval(') ||
    lower.includes('object') ||
    raw.includes('{') ||
    raw.includes('}') ||
    raw.includes('(') ||
    raw.includes(')')
  ) {
    return defaultMsg;
  }
  
  if (raw.length < 120 && !raw.includes('/') && !raw.includes('\\') && !raw.includes('fn_') && !raw.includes('sql')) {
    return raw;
  }
  
  return defaultMsg;
}
