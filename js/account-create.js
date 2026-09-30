import { createPasswordAccount } from './academy-auth.js?v=26';
import { passwordIssue } from './account-flow.js?v=3';

// Account creation is shared by the account page and seminar enrollment.
// Keeping validation and the Firebase call here prevents the two entry points
// from drifting apart.
export async function createAccount(email, password, confirmation) {
  const issue = passwordIssue(password, confirmation);
  if (issue) throw Object.assign(new Error(issue), { code: 'academy/invalid-password' });
  return createPasswordAccount(email, password);
}
