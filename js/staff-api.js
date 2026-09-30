import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-functions.js';
// The callable SDK supplies the current Firebase identity; no privileged credentials live here.
export async function staffCall(operation, data = {}) {
  return (await httpsCallable(getFunctions(getApp(), 'us-central1'), operation)(data)).data;
}
export function staffError(error) {
  if (error?.code === 'functions/permission-denied') return 'Your access has changed. Refreshing teaching assignments…';
  if (error?.code === 'functions/unauthenticated') return 'Please sign in again.';
  if (['functions/invalid-argument','functions/failed-precondition','functions/not-found'].includes(error?.code)) return error.message;
  return 'Staff services are unavailable. Please try again later or contact the Academy administrator.';
}
