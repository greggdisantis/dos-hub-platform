import { MODULE_KEY } from '../../domain/src/motorizedScreens';

export type MotorizedScreensSubmission = {
  moduleKey: typeof MODULE_KEY;
  schemaVersion: number;
  submissionId: string;
  projectId: string;
  projectName: string;
  createdByUid: string;
  createdAt: string;
  header: {
    projectName: string;
    date: string;
    address: string;
    submitter: string;
    screenManufacturer: 'DOS Screens' | 'MagnaTrack';
    totalNumberOfScreens: number;
  };
  screens: unknown[];
  derivedAudit: unknown[];
};

export async function appendOnlySaveSubmission(db: any, uid: string, submission: MotorizedScreensSubmission) {
  const submissionPath = `users/${uid}/projects/${submission.projectId}/submissions/${submission.submissionId}`;
  await db.doc(submissionPath).set(submission);

  const activityPath = `users/${uid}/activity/${submission.submissionId}`;
  await db.doc(activityPath).set({
    type: 'motorized_screens_submission_saved',
    moduleKey: MODULE_KEY,
    projectId: submission.projectId,
    submissionId: submission.submissionId,
    createdAt: submission.createdAt,
    myProjects: {
      module: 'Motorized Screens – Ordering Tool',
      summary: `${submission.header.totalNumberOfScreens} screens`,
    },
  });
}

export async function persistExportTrace(db: any, uid: string, submissionId: string, trace: { makeExecutionId?: string; sharePointUrl?: string; exportedAt: string }) {
  const exportTracePath = `users/${uid}/activity/${submissionId}__export__${trace.exportedAt}`;
  await db.doc(exportTracePath).set({
    type: 'motorized_screens_exported',
    submissionId,
    exportPipeline: 'make_to_sharepoint',
    ...trace,
  });
}
