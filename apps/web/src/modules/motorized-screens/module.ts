import { randomUUID } from 'crypto';
import { requireAuthenticatedUser } from '../../guards/firebaseAuthGuard';
import { MODULE_KEY, MotorizedScreenItemInput, buildPdfStructuredSections, deriveMeasurementSummary, normalizeManufacturerAndMotor, validateScreenItem } from '../../../../../packages/domain/src/motorizedScreens';
import { appendOnlySaveSubmission, persistExportTrace } from '../../../../../packages/firebase/src/motorizedScreensRepository';
import { postToMakeWebhook } from '../../../../../packages/integrations/src/makeSharepoint';
import { buildMotorizedScreensPdf, buildMotorizedScreensPdfFileName } from './pdf';

export async function saveMotorizedScreensOrder(params: {
  db: any;
  user: { uid: string } | null;
  projectId: string;
  projectName: string;
  address: string;
  submitter: string;
  date: string;
  screenManufacturer: 'DOS Screens' | 'MagnaTrack';
  screens: MotorizedScreenItemInput[];
}) {
  const user = requireAuthenticatedUser(params.user);
  const errors = params.screens.flatMap((s) => validateScreenItem(normalizeManufacturerAndMotor(s)));
  if (!params.projectId) errors.push('Project is required');
  if (!params.screens.length) errors.push('At least one screen is required');
  if (errors.length) throw new Error(errors.join('; '));

  const submissionId = randomUUID();
  const createdAt = new Date().toISOString();
  const normalizedScreens = params.screens.map(normalizeManufacturerAndMotor);

  const submission = {
    moduleKey: MODULE_KEY,
    schemaVersion: 1,
    submissionId,
    projectId: params.projectId,
    projectName: params.projectName,
    createdByUid: user.uid,
    createdAt,
    header: {
      projectName: params.projectName,
      date: params.date,
      address: params.address,
      submitter: params.submitter,
      screenManufacturer: params.screenManufacturer,
      totalNumberOfScreens: normalizedScreens.length,
    },
    screens: normalizedScreens.map((screen) => ({
      screenNumber: screen.screenNumber,
      ...buildPdfStructuredSections(screen),
    })),
    derivedAudit: normalizedScreens.map((screen) => ({
      screenNumber: screen.screenNumber,
      ...deriveMeasurementSummary(screen.section6Raw),
    })),
  } as const;

  await appendOnlySaveSubmission(params.db, user.uid, submission as any);
  return submission;
}

export function buildOrderPdfSections(submission: Awaited<ReturnType<typeof saveMotorizedScreensOrder>>) {
  return {
    header: submission.header,
    screens: submission.screens,
  };
}

export async function exportMotorizedScreensOrder(params: {
  db: any;
  webhookUrl: string;
  userUid: string;
  submission: Awaited<ReturnType<typeof saveMotorizedScreensOrder>>;
  pdfBase64?: string;
}) {
  const fileName = buildMotorizedScreensPdfFileName(params.submission.projectName, params.submission.submissionId);
  const generatedPdfBase64 = params.pdfBase64 ?? Buffer.from(buildMotorizedScreensPdf(params.submission)).toString('base64');

  const statusAtQueued = new Date().toISOString();
  await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
    status: 'queued',
    statusAt: statusAtQueued,
  });

  try {
    const payload = {
      moduleKey: MODULE_KEY,
      projectId: params.submission.projectId,
      submissionId: params.submission.submissionId,
      projectName: params.submission.projectName,
      uid: params.userUid,
      pdfBase64: generatedPdfBase64,
      fileName,
      createdAt: new Date().toISOString(),
    };

    const makeResult = await postToMakeWebhook(params.webhookUrl, payload);
    const statusAtSent = new Date().toISOString();
    await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
      status: 'sent_to_make',
      makeExecutionId: makeResult?.executionId,
      sharePointUrl: makeResult?.sharePointUrl,
      exportedAt: statusAtSent,
      statusAt: statusAtSent,
    });

    if (makeResult?.sharePointUrl || makeResult?.sharePointFileId || makeResult?.archived === true) {
      const statusAtArchived = new Date().toISOString();
      await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
        status: 'archived',
        makeExecutionId: makeResult?.executionId,
        sharePointUrl: makeResult?.sharePointUrl,
        exportedAt: statusAtArchived,
        statusAt: statusAtArchived,
      });
    }

    return { fileName, makeResult };
  } catch (error: any) {
    const statusAtFailed = new Date().toISOString();
    await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
      status: 'failed',
      errorSummary: String(error?.message || error || 'Unknown export error').slice(0, 500),
      statusAt: statusAtFailed,
    });
    throw error;
  }
}
