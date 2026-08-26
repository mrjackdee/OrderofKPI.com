import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyError(err: any, defaultMsg = "An unexpected error occurred. Please try again."): string {
  if (!err) return defaultMsg;
  const raw = typeof err === 'string' ? err : (err.message || String(err));
  const lower = raw.toLowerCase();
  
  // 401 Unauthorized / Credentials / Invalid Login
  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid-credential') || 
    lower.includes('wrong-password') || 
    lower.includes('user-not-found') || 
    lower.includes('invalid credential') || 
    lower.includes('auth/invalid-credential') ||
    lower.includes('invalid email or password') ||
    lower.includes('incorrect password')
  ) {
    return "Invalid email address or password. Please verify your credentials and try again.";
  }

  // 403 Forbidden / Permissions / Disabled Accounts / Role Restrictions
  if (
    lower.includes('403') ||
    lower.includes('forbidden') ||
    lower.includes('missing or insufficient permissions') || 
    lower.includes('permission-denied') ||
    lower.includes('permission denied') ||
    lower.includes('admin access required') ||
    lower.includes('admin privileges required') ||
    lower.includes('not authorized')
  ) {
    if (lower.includes('permanently disabled') || lower.includes('disabled')) {
      return "This account has been disabled. Please contact the administrator at admin@orderofkpi.org.";
    }
    if (lower.includes('vote') || lower.includes('voting') || lower.includes('ballot') || lower.includes('eligible')) {
      return "You do not currently have authorization to cast votes. Voting is restricted to eligible active members.";
    }
    return "You do not have permission to perform this action. Please verify your account role or contact an administrator.";
  }

  // 404 Not Found
  if (lower.includes('404') || lower.includes('not found') || lower.includes('does not exist')) {
    if (lower.includes('user') || lower.includes('account') || lower.includes('member') || lower.includes('candidate')) {
      return "The requested account or member record could not be found.";
    }
    return "The requested resource could not be found. Please check your details and try again.";
  }

  // 429 Too Many Requests / Rate Limiting
  if (lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit') || lower.includes('quota')) {
    return "Too many requests. Please wait a moment before trying again.";
  }

  // 500 / 502 / 503 / 504 Server Errors
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('internal server error') ||
    lower.includes('bad gateway') ||
    lower.includes('service unavailable')
  ) {
    return "The service is temporarily unavailable. Please try again in a few moments.";
  }

  // Network & Connectivity
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('net::err') || lower.includes('econnrefused') || lower.includes('networkerror')) {
    return "Network connection issue detected. Please check your internet connection and try again.";
  }

  // JSON parsing / HTML error responses
  if (lower.includes('json') || lower.includes('syntaxerror') || lower.includes('unexpected token') || lower.includes('html') || lower.includes('non-json')) {
    return "Unable to process the server response. Please try again later or contact support.";
  }

  // Timeout
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return "The request took too long to complete. Please try again.";
  }

  // Email collisions
  if (lower.includes('email-already-in-use') || lower.includes('already exists')) {
    return "This email address is already registered.";
  }

  // Password reset tokens
  if (lower.includes('invalid-action-code') || lower.includes('expired-action-code') || lower.includes('token expired') || lower.includes('invalid token')) {
    return "The password reset link is invalid or has expired. Please request a new password reset link.";
  }

  // Block technical stack trace leaks & browser DOMExceptions
  if (
    lower.includes('typeerror') ||
    lower.includes('referenceerror') ||
    lower.includes('syntaxerror') ||
    lower.includes('domexception') ||
    lower.includes('string did not match') ||
    lower.includes('expected pattern') ||
    lower.includes('at ') ||
    lower.includes('eval(') ||
    lower.includes('object') ||
    raw.includes('{') ||
    raw.includes('}') ||
    raw.includes('(') ||
    raw.includes(')') ||
    raw.includes('http://') ||
    raw.includes('https://')
  ) {
    return defaultMsg;
  }
  
  // Clean short human-friendly messages passed through from clean backend responses
  if (raw.length < 140 && !raw.includes('/') && !raw.includes('\\') && !raw.includes('fn_') && !raw.includes('sql') && !raw.includes('status')) {
    return raw;
  }
  
  return defaultMsg;
}
