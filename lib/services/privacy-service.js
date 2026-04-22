export function buildDeletionPlan({ rawFileName, structuredResumeSaved }) {
  return {
    rawFileName,
    shouldDeleteRawFile: true,
    structuredResumeSaved,
    message: structuredResumeSaved
      ? "Raw file can be deleted after extraction. Structured resume remains because the user opted in to save it."
      : "Raw file and derived structured content should both be deleted after the active session ends."
  };
}

export function createAuditEvent(action, metadata = {}) {
  return {
    action,
    metadata,
    createdAt: new Date().toISOString()
  };
}
