import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createStaffService, StaffError } from './staff-service.js';
initializeApp();
const service = createStaffService({ db: getDatabase(), auth: getAuth() });
const callable = name => onCall({ region: 'us-central1', maxInstances: 5 }, async request => {
  try { return await service[name](request); }
  catch (error) {
    if (error instanceof StaffError) throw new HttpsError(error.code, error.message);
    if (error.code === 'auth/user-not-found') throw new HttpsError('not-found', 'Account not found.');
    // Do not return database contents, credentials, or SDK error internals.
    throw new HttpsError('internal', 'Could not complete this operation. Please try again.');
  }
});
export const getTeachingAssignments = callable('getTeachingAssignments');
export const getTeachingAssignmentRoles = callable('getTeachingAssignmentRoles');
export const getTeachingRoster = callable('getTeachingRoster');
export const staffSetEnrollment = callable('staffSetEnrollment');
export const staffSetAttendance = callable('staffSetAttendance');
export const staffSetEvaluation = callable('staffSetEvaluation');
export const adminGetAuthSummary = callable('adminGetAuthSummary');
export const adminListInstructors = callable('adminListInstructors');
export const adminAssignInstructor = callable('adminAssignInstructor');
export const adminRevokeInstructor = callable('adminRevokeInstructor');
export const adminDeleteRegistration = callable('adminDeleteRegistration');

export const staffMarkAllAttended = callable('staffMarkAllAttended');
export const participantSetEvaluationRequest = callable('participantSetEvaluationRequest');
export const staffSetEvaluationRequest = callable('staffSetEvaluationRequest');
