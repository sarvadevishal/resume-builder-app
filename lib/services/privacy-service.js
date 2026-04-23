export function buildDeletionPlan({ rawFileName, structuredResumeSaved, deleteRawFile = true }) {
  return {
    rawFileName,
    shouldDeleteRawFile: deleteRawFile,
    structuredResumeSaved,
    message: deleteRawFile
      ? structuredResumeSaved
        ? "Raw file can be deleted after extraction. Structured resume remains because the user opted in to save it."
        : "Raw file and derived structured content should both be deleted after the active session ends."
      : structuredResumeSaved
        ? "Raw file retention is enabled, and structured resume data remains because the user opted in to save it."
        : "Raw file retention is enabled. Structured resume data still clears when the active session ends."
  };
}

export function createAuditEvent(action, metadata = {}) {
  return {
    action,
    metadata,
    createdAt: new Date().toISOString()
  };
}
