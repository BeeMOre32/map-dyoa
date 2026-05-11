/** `readJsonSafely` 등에서 만든 메시지에 포함된 백엔드 추적 ID */
const REQUEST_ID_IN_MESSAGE = /requestId=([0-9a-f-]{36})/i;

export function extractBackendRequestIdFromMessage(message: string): string | null {
  const m = REQUEST_ID_IN_MESSAGE.exec(message);
  return m?.[1] ?? null;
}

export function newIncidentReferenceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ref-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function buildErrorReportClipboardText(parts: {
  incidentId: string;
  digest?: string | null;
  backendRequestId?: string | null;
  errorMessage: string;
  errorStack?: string | null;
  pageUrl?: string | null;
}): string {
  const lines = [
    "[Map-Dyoa 오류 제보]",
    `제보 참조 번호: ${parts.incidentId}`,
    parts.digest ? `Next digest: ${parts.digest}` : null,
    parts.backendRequestId ? `백엔드 requestId: ${parts.backendRequestId}` : null,
    parts.pageUrl ? `페이지: ${parts.pageUrl}` : null,
    `발생 시각(UTC): ${new Date().toISOString()}`,
    "",
    "--- 메시지 ---",
    parts.errorMessage,
    "",
    parts.errorStack ? `--- 스택(앞부분) ---\n${parts.errorStack.slice(0, 2500)}` : null,
  ];
  return lines.filter((l) => l != null && l !== "").join("\n");
}
