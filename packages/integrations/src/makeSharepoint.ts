export type MakeExportPayload = {
  moduleKey: string;
  projectId: string;
  submissionId: string;
  projectName: string;
  uid: string;
  pdfBase64: string;
  fileName: string;
  createdAt: string;
};

export async function postToMakeWebhook(webhookUrl: string, payload: MakeExportPayload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Make webhook failed: ${response.status} ${text}`);
  }

  return response.json();
}
