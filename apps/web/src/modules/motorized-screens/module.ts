import { randomUUID } from 'crypto';
import { requireAuthenticatedUser } from '../../guards/firebaseAuthGuard';
import { MODULE_KEY, MotorizedScreenItemInput, buildPdfStructuredSections, deriveMeasurementSummary, normalizeManufacturerAndMotor, validateScreenItem } from '../../../../../packages/domain/src/motorizedScreens';
import { appendOnlySaveSubmission, persistExportTrace } from '../../../../../packages/firebase/src/motorizedScreensRepository';
import { postToMakeWebhook } from '../../../../../packages/integrations/src/makeSharepoint';
import { buildMotorizedScreensPdf, buildMotorizedScreensPdfFileName } from './pdf';

const MAKE_MAX_ATTEMPTS = 3;
const MAKE_RETRY_BACKOFF_MS = 250;

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function postToMakeWithRetry(webhookUrl: string, payload: any) {
  let attempt = 0;
  let lastError: any;

  while (attempt < MAKE_MAX_ATTEMPTS) {
    attempt += 1;
    try {
      const result = await postToMakeWebhook(webhookUrl, payload);
      return { result, attempt };
    } catch (error: any) {
      lastError = error;
      if (attempt >= MAKE_MAX_ATTEMPTS) break;
      await delay(MAKE_RETRY_BACKOFF_MS * attempt);
    }
  }

  throw { error: lastError, attemptCount: MAKE_MAX_ATTEMPTS };
}


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

    const { result: makeResult, attempt: successAttempt } = await postToMakeWithRetry(params.webhookUrl, payload);
    const statusAtSent = new Date().toISOString();
    await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
      status: 'sent_to_make',
      makeExecutionId: makeResult?.executionId,
      sharePointUrl: makeResult?.sharePointUrl,
      exportedAt: statusAtSent,
      attemptCount: successAttempt,
      statusAt: statusAtSent,
    });

    if (makeResult?.sharePointUrl || makeResult?.sharePointFileId || makeResult?.archived === true) {
      const statusAtArchived = new Date().toISOString();
      await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
        status: 'archived',
        makeExecutionId: makeResult?.executionId,
        sharePointUrl: makeResult?.sharePointUrl,
        exportedAt: statusAtArchived,
        attemptCount: successAttempt,
        statusAt: statusAtArchived,
      });
    }

    return { fileName, makeResult };
  } catch (wrappedError: any) {
    const statusAtFailed = new Date().toISOString();
    const finalError = wrappedError?.error || wrappedError;
    const attemptCount = wrappedError?.attemptCount || 1;
    await persistExportTrace(params.db, params.userUid, params.submission.submissionId, {
      status: 'failed',
      attemptCount,
      errorSummary: String(finalError?.message || finalError || 'Unknown export error').slice(0, 500),
      statusAt: statusAtFailed,
    });
    throw finalError;
  }
}
