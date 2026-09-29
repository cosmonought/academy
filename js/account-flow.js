// Pure helpers shared by the account screen and its tests.
export const seminarPages = {
  'sex-and-or-love': '/sex-and-or-love.html',
  'coining-reason-unit-1': '/CoiningReason/#archive',
  'coining-reason-unit-2': '/CoiningReason/#current'
};

export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return '/profile.html';
  const url = new URL(value, 'https://academy.netadao.org');
  const allowed = ['/', '/profile.html', '/sex-and-or-love.html', '/CoiningReason/', '/SexMonstersSuperheroes/', '/seminar.html', '/forthcoming.html', '/cinema.html', '/admin.html', '/seminars.html'];
  return url.origin === 'https://academy.netadao.org' && allowed.includes(url.pathname)
    ? url.pathname + url.search + url.hash : '/profile.html';
}

export function signInDestination(value) {
  return safeReturnPath(value);
}

export function seminarAccountLink(seminar, view, returnTo) {
  return '/account.html?' + new URLSearchParams({ seminar, view, returnTo: safeReturnPath(returnTo) });
}

export function destinationLabel(path) {
  if (/#(?:accessPanel|unit[12]AccessPanel)$/.test(path)) return 'Return to seminar access →';
  const page = path.split(/[?#]/)[0];
  return ({
    '/profile.html': 'Continue to your profile →',
    '/sex-and-or-love.html': 'Continue to Sex, and/or Love →',
    '/CoiningReason/': 'Continue to Coining Reason →',
    '/seminar.html': 'Continue to Coining Reason →',
    '/SexMonstersSuperheroes/': 'Continue to Sex, Monsters, and Superheroes →',
    '/cinema.html': 'Continue to Cinema →',
    '/admin.html': 'Continue to administration →',
    '/seminars.html': 'Continue to seminars →',
    '/': 'Continue to Academy home →'
  })[page] || 'Continue to your profile →';
}

export function passwordIssue(password, confirmation) {
  if (password.length < 8) return 'Use at least 8 characters for your new password.';
  if (password !== confirmation) return 'The passwords do not match. Please enter them again.';
  return '';
}

export function accountError(error) {
  switch (error?.code) {
    case 'academy/invalid-password': return error.message;
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'We couldn’t sign you in with those details. Check your email and password, or choose “Set or reset a password.”';
    case 'auth/email-already-in-use': return 'An account already uses this email. Sign in, or choose “Set or reset a password” if you previously used an email link.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'Choose a stronger password. Use at least 8 characters, with uppercase and lowercase letters, a number, and a symbol.';
    case 'auth/requires-recent-login': return 'Please sign in again before changing your password, or use “Set or reset a password.”';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded': return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed': return 'We couldn’t connect. Check your connection and try again.';
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code': return 'This password link has expired or has already been used. Request another from “Set or reset a password.”';
    case 'academy/signup-unavailable':
    case 'auth/operation-not-allowed': return 'New accounts are temporarily unavailable. Existing participants can still sign in. Contact academy@netadao.org for help.';
    case 'PERMISSION_DENIED':
    case 'database/permission-denied': return 'We couldn’t connect this account to the registration. If you registered before, contact @NetaDAO_Academy from your registered X handle so we can restore your access.';
    default: return 'We couldn’t complete that step. Please try again. If it continues, contact academy@netadao.org.';
  }
}
