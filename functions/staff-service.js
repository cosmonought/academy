import { ATTENDANCE_EVENTS, EVALUATION_OFFERED, EVALUATION_FORMS, EVALUATION_OUTCOMES } from './shared/academy-record.js';
import { ACADEMY_SEMINAR_POLICY_VERSION, GRAPHIC_SEMINAR_ID } from './shared/seminar-policies.js';
const ADMIN_EMAIL = 'academy@netadao.org';
export class StaffError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new StaffError(code, message); };
const key = value => {
  if (typeof value !== 'string' || !value || value.length > 200 || /[.#$\[\]/\x00-\x1f\x7f]/.test(value)) fail('invalid-argument', 'Invalid record key.');
  return value;
};
const emailValue = value => {
  if (typeof value !== 'string') fail('invalid-argument', 'Enter an email address.');
  const email = value.trim().toLowerCase();
  if (email.length > 120 || !/^[^\s@/#$\[\]]+@[^\s@/#$\[\]]+\.[^\s@/#$\[\]]+$/.test(email)) fail('invalid-argument', 'Enter a valid email address.');
  return email;
};
const emailKey = email => key(email.replace(/\./g, ','));
const seminarValue = id => { if (!Object.hasOwn(ATTENDANCE_EVENTS, id)) fail('invalid-argument', 'Unknown seminar.'); return id; };
const pick = (record, fields) => Object.fromEntries(fields.filter(field => record[field] !== undefined).map(field => [field, record[field]]));
export function createStaffService({ db, auth }) {
  const read = async path => (await db.ref(path).get()).val();
  async function caller(request) {
    if (!request.auth?.uid) fail('unauthenticated', 'Sign in first.');
    const user = await auth.getUser(request.auth.uid);
    if (user.disabled || (user.tokensValidAfterTime && request.auth.token.auth_time * 1000 < Date.parse(user.tokensValidAfterTime))) fail('unauthenticated', 'Please sign in again.');
    const admin = user.email === ADMIN_EMAIL && user.emailVerified === true && request.auth.token.email === ADMIN_EMAIL && request.auth.token.email_verified === true;
    return { uid: user.uid, admin };
  }
  const adminOnly = async request => { const who = await caller(request); if (!who.admin) fail('permission-denied', 'Administrator access required.'); return who; };
  async function scope(request, requiredRole = null) {
    const who = await caller(request), id = seminarValue(request.data?.seminarId), assignment = (await read(`seminarStaff/${id}/${who.uid}`)) || {};
    const role = who.admin ? 'admin' : assignment.role;
    if (!who.admin && !['instructor','ta'].includes(role)) fail('permission-denied', 'Teaching access is no longer available for this seminar.');
    if (requiredRole && !who.admin && role !== requiredRole) fail('permission-denied', 'This teaching action is not available to your role.');
    return { ...who, id, role };
  }
  async function target(request, enrolled = false, requiredRole = null) {
    const who = await scope(request, requiredRole), participantKey = key(request.data?.emailKey);
    const path = `academyRegistrations/${participantKey}/${who.id}`, reg = await read(path);
    if (!reg) fail('not-found', 'Registration no longer exists.');
    if (enrolled && !who.admin && reg.enrolled !== true) fail('failed-precondition', 'Participant must be enrolled.');
    return { ...who, participantKey, path, reg };
  }
  return {
    async getTeachingAssignmentRoles(request) {
      const who = await caller(request), result = {};
      for (const id of Object.keys(ATTENDANCE_EVENTS)) { const role = (await read(`seminarStaff/${id}/${who.uid}`))?.role; if (['instructor','ta'].includes(role)) result[id] = role; }
      return result;
    },
    async getTeachingAssignments(request) {
      const who = await caller(request), result = [];
      for (const id of Object.keys(ATTENDANCE_EVENTS)) if (['instructor','ta'].includes((await read(`seminarStaff/${id}/${who.uid}`))?.role)) result.push(id);
      return result;
    },
    async getTeachingRoster(request) {
      const { id, role } = await scope(request);
      // RTDB rules are not filters. This server read never reaches the browser unchanged.
      const all = await read('academyRegistrations') || {}, rows = [];
      for (const [participantKey, seminars] of Object.entries(all)) {
        const reg = seminars[id];
        if (!reg) continue;
        rows.push({ emailKey: participantKey, registration: pick(reg, ['name','email','xHandle','reason','enrolled','requestedAt','policyAccepted','policyVersion','policyAcceptedAt','attendance']), evaluation: await read(`evaluations/${participantKey}/${id}`) || {} });
      }
      return rows.map(row => role === 'ta' ? { emailKey: row.emailKey, registration: pick(row.registration, ['name','email','enrolled','attendance']), evaluation: {} } : row);
    },
    async staffSetEnrollment(request) {
      const { id, path, reg } = await target(request, false, 'instructor');
      if (typeof request.data.enrolled !== 'boolean') fail('invalid-argument', 'Enrollment must be true or false.');
      if (request.data.enrolled && id === GRAPHIC_SEMINAR_ID && (reg.policyAccepted !== true || reg.policyVersion !== ACADEMY_SEMINAR_POLICY_VERSION || typeof reg.policyAcceptedAt !== 'number')) fail('failed-precondition', 'Current seminar policy acceptance must be recorded before enrollment.');
      await db.ref(path).update({ enrolled: request.data.enrolled });
      return { changed: (reg.enrolled === true) !== request.data.enrolled, email: reg.email || '', name: reg.name || '' };
    },
    async staffSetAttendance(request) {
      const { id, path } = await target(request, true);
      const { eventKey, attended } = request.data;
      if (!ATTENDANCE_EVENTS[id].some(event => event.key === eventKey) || typeof attended !== 'boolean') fail('invalid-argument', 'Choose a valid attendance event and mark.');
      await db.ref(`${path}/attendance/${eventKey}`).set(attended);
      return { saved: true };
    },
    async staffSetEvaluation(request) {
      const { id, participantKey, admin } = await target(request, true, 'instructor'), record = request.data.record;
      if (!EVALUATION_OFFERED[id] || !record || typeof record !== 'object' || Array.isArray(record)) fail('invalid-argument', 'Evaluation is not available.');
      if (Object.keys(record).some(field => !['state','form','outcome','feedback'].includes(field)) || !['agreed','in-progress','completed'].includes(record.state) || !Object.hasOwn(EVALUATION_FORMS, record.form) || typeof record.feedback !== 'string' || record.feedback.length > 10000 || (record.state === 'completed' ? !Object.hasOwn(EVALUATION_OUTCOMES, record.outcome) : record.outcome !== undefined)) fail('invalid-argument', 'Check evaluation state, form, outcome, and feedback.');
      if (!admin && !await read(`evaluations/${participantKey}/${id}/request`)) fail('failed-precondition', 'No participant evaluation request.');
      await db.ref(`evaluations/${participantKey}/${id}/instructor`).set(record);
      return { saved: true };
    },
    async adminGetAuthSummary(request) {
      await adminOnly(request);
      const email = emailValue(request.data?.email);
      let user = null;
      try { user = await auth.getUserByEmail(email); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
      const registrations = await read(`academyRegistrations/${emailKey(email)}`) || {};
      const meta = await read(`accountMeta/${emailKey(email)}`) || {};
      const providers = user ? [...new Set(user.providerData.map(provider => provider.providerId))] : [];
      return { email, account: user ? { uid: user.uid, email: user.email || email, emailVerified: user.emailVerified, disabled: user.disabled, providers, createdAt: user.metadata.creationTime || null, lastSignInAt: user.metadata.lastSignInTime || null, passwordStatus: providers.includes('password') && meta.hasPassword === true ? 'Recorded as set (account metadata)' : providers.includes('password') ? 'Unknown / legacy account' : providers.includes('google.com') ? 'Not required for Google sign-in' : 'Unknown' } : null,
        registrations: Object.entries(registrations).map(([seminarId, reg]) => ({ seminarId, name: reg.name || '', enrolled: reg.enrolled === true })) };
    },
    async adminListInstructors(request) {
      await adminOnly(request);
      return await read('seminarStaff') || {};
    },
    async adminAssignInstructor(request) {
      const who = await adminOnly(request), id = seminarValue(request.data?.seminarId), uid = key(request.data?.uid);
      const user = await auth.getUser(uid);
      if (user.disabled) fail('failed-precondition', 'This account is disabled.');
      const role = request.data?.role === 'ta' ? 'ta' : 'instructor';
      await db.ref(`seminarStaff/${id}/${uid}`).set({ role, email: user.email || '', assignedAt: Date.now(), assignedBy: who.uid });
      return { assigned: true, role };
    },
    async adminAssignTeachingAssistant(request) {
      const who = await adminOnly(request), id = seminarValue(request.data?.seminarId), uid = key(request.data?.uid);
      const user = await auth.getUser(uid);
      if (user.disabled) fail('failed-precondition', 'This account is disabled.');
      await db.ref(`seminarStaff/${id}/${uid}`).set({ role: 'ta', email: user.email || '', assignedAt: Date.now(), assignedBy: who.uid });
      return { assigned: true, role: 'ta' };
    },
    async adminRevokeInstructor(request) {
      await adminOnly(request);
      await db.ref(`seminarStaff/${seminarValue(request.data?.seminarId)}/${key(request.data?.uid)}`).set(null);
      return { revoked: true };
    },
    async adminDeleteRegistration(request) {
      await adminOnly(request);
      const id = seminarValue(request.data?.seminarId), participantKey = key(request.data?.emailKey);
      if (request.data.confirm !== `${participantKey}/${id}`) fail('failed-precondition', 'Confirm the participant and seminar before deleting.');
      await db.ref().update({ [`academyRegistrations/${participantKey}/${id}`]: null, [`evaluations/${participantKey}/${id}`]: null });
      return { deleted: true };
    }
  };
}
