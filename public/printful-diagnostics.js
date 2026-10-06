// All dynamic diagnostic text uses textContent, never HTML. No credentials persisted here.
export function attachPrintfulDiagnostic(article, job, api) {
  if (job.digital) return;
  const box = document.createElement('div');
  const button = document.createElement('button');
  const result = document.createElement('p');
  let recoveryButton = null;
  button.type = 'button'; button.className = 'secondary';
  button.textContent = 'Check Printful status'; button.dataset.printfulCheck = 'true';
  button.style.cssText = 'margin-top:14px;min-height:44px';
  result.className = 'muted'; result.hidden = true;
  result.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55';
  result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite');
  box.append(button, result); article.append(box);
  const ambiguous = /Draft submission already started/i.test(String(job.ownerReleaseError || job.autoPrintError || ''));
  if (ambiguous) {
    for (const action of article.querySelectorAll('.op-actions button')) {
      if (action.textContent === 'Create Printful draft') {
        action.disabled = true; action.title = 'Check the existing attempt before creating another draft.';
      }
    }
  }
  button.addEventListener('click', async () => {
    button.disabled = true; button.textContent = 'Checking Printful — read only…';
    result.hidden = false; result.textContent = 'Checking this order reference. No order will be created or sent to production.';
    try {
      const data = await api(`/api/admin/job/${encodeURIComponent(job.id)}/printful-check`);
      const lines = [data.message, `Configured Printful store: ${data.configuredStoreId || 'not configured'}`];
      if (data.order) lines.push(`Printful order #${data.order.id} · ${data.order.status}`);
      if (data.storeScan) lines.push(`Orders checked in this store: ${data.storeScan.checked}${data.storeScan.total !== null ? ' of '+data.storeScan.total : ''} · ${data.storeScan.complete ? 'complete snapshot' : 'incomplete snapshot'}`);
      lines.push(`Diagnostic: ${data.diagnosticVersion || 'unknown'} · Provider requests: ${data.providerRequestCount ?? 'unknown'}${data.providerStatus ? ' · HTTP '+data.providerStatus : ''}${data.lookupFailure ? ' · '+data.lookupFailure : ''}`);
      if (data.draftAttemptRecorded) lines.push(`Recast draft-attempt lock: present${data.draftAttemptStartedAt ? ' · '+data.draftAttemptStartedAt : ''}`);
      if (data.externalIdValid === false) lines.push(`Order-reference problem: ${data.externalIdLength} characters (Printful allows up to 32, using letters, digits, hyphens and underscores).`);
      lines.push(`Reference: ${data.externalId}`, data.safety);
      result.textContent = lines.filter(Boolean).join('\n\n');
      if (recoveryButton) { recoveryButton.remove(); recoveryButton = null; }
      const canRecover = data.state === 'not_found_here' && data.storeScan?.complete === true &&
        data.storeScan?.total === 0 && data.draftAttemptRecorded === true &&
        data.externalIdValid === false && !data.recordedPrintfulOrderId;
      if (canRecover) {
        recoveryButton = document.createElement('button');
        recoveryButton.type = 'button'; recoveryButton.className = 'secondary';
        recoveryButton.textContent = 'Recover missing draft safely';
        recoveryButton.style.cssText = 'margin-top:10px;min-height:44px';
        recoveryButton.addEventListener('click', async () => {
          const message='Printful currently reports zero orders in this configured store. Recast will re-check Printful, replace only this stale attempt lock, create ONE corrected draft, and keep it on hold. It will NOT send anything to paid production. Continue?';
          if (typeof globalThis.confirm === 'function' && !globalThis.confirm(message)) return;
          recoveryButton.disabled = true;
          result.textContent = 'Re-checking Printful and recovering one draft. Paid production remains blocked.';
          try {
            const recovered = await api(`/api/admin/job/${encodeURIComponent(job.id)}/recover-missing-draft`,{method:'POST',body:{confirm:'RECOVER_MISSING_DRAFT'}});
            result.textContent = `Recovered Printful draft #${recovered.printfulOrderId}. It is ON HOLD for inspection and has NOT been submitted to paid production. Refreshing the order card…`;
            recoveryButton.textContent = 'Draft recovered — held for review';
            setTimeout(() => globalThis.location?.reload?.(), 650);
          } catch (error) {
            recoveryButton.disabled = false;
            result.textContent = (error.message || 'Recovery stopped safely.') + '\n\nNo paid production submission was requested.';
          }
        });
        box.append(recoveryButton);
      }
    } catch (error) {
      result.textContent = error.message || 'The check could not be completed. Do not submit another draft.';
    } finally {
      button.disabled = false; button.textContent = 'Check Printful status';
    }
  });
}
