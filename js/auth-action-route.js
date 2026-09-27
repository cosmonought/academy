// A fixed fallback preserves Firebase's verification, recovery, and legacy actions.
// Never choose the handler host from incoming query parameters.
export function emailActionDestination(search) {
  const params = new URLSearchParams(search);
  if (params.get('mode') === 'resetPassword') {
    const reset = new URLSearchParams({ mode: 'resetPassword' });
    if (params.get('oobCode')) reset.set('oobCode', params.get('oobCode'));
    return '/account.html?' + reset;
  }
  return 'https://neta-dao-cinema.firebaseapp.com/__/auth/action?' + params;
}
