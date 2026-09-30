// Canonical policy metadata used by future seminar-enrollment flows.
// The visible policy text lives once on /seminars.html#seminar-policies.
export const ACADEMY_SEMINAR_POLICY_VERSION = '2026-09-29-r2';
export const GRAPHIC_SEMINAR_ID = 'sex-monsters-superheroes';

// Use this record only after a person actively checks the enrollment-time
// agreement control. Express Interest must never call this helper.
export function policyAcceptanceRecord(accepted) {
  if (accepted !== true) throw new Error('Academy Seminar Policies must be accepted before requesting enrollment.');
  return {
    policyAccepted: true,
    policyVersion: ACADEMY_SEMINAR_POLICY_VERSION,
    policyAcceptedAt: Date.now()
  };
}
