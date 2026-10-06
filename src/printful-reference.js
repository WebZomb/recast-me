// References identify jobs, never artwork. Existing attempts must retain their original reference.
export const validPrintfulReference = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(value);
export async function printfulJobHash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function printfulReferenceForNewDraft(job) {
  if (typeof job?.id !== 'string' || !/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,179}$/.test(job.id)) {
    throw new Error('Invalid Recast job reference.');
  }
  if (job.printfulExternalId !== undefined && job.printfulExternalId !== null) {
    if (!validPrintfulReference(job.printfulExternalId)) throw new Error('Stored Printful reference needs owner review; it will not be replaced automatically.');
    return job.printfulExternalId;
  }
  const legacy = `recast-${job.id}`;
  if (validPrintfulReference(legacy)) return legacy;
  // Hash the whole job ID rather than truncating IDs that may differ only at the end.
  // 3-character prefix + 29 hex characters = 32 characters / 116 hash bits.
  return `rm-${(await printfulJobHash(job.id)).slice(0, 29)}`;
}
