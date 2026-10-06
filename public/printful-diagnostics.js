// All dynamic diagnostic text uses textContent, never HTML. No credentials persisted here.
export function attachPrintfulDiagnostic(article, job, api) {
  if (job.digital) return;
  const box = document.createElement('div');
  const button = document.createElement('button');
  const result = document.createElement('p');
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
      if (data.draftAttemptRecorded) lines.push(`Recast draft-attempt lock: present${data.draftAttemptStartedAt ? ' · '+data.draftAttemptStartedAt : ''}`);
      if (data.externalIdValid === false) lines.push(`Order-reference problem: ${data.externalIdLength} characters (Printful allows up to 32, using letters, digits, hyphens and underscores).`);
      lines.push(`Reference: ${data.externalId}`, data.safety);
      result.textContent = lines.filter(Boolean).join('\n\n');
    } catch (error) {
      result.textContent = error.message || 'The check could not be completed. Do not submit another draft.';
    } finally {
      button.disabled = false; button.textContent = 'Check Printful status';
    }
  });
}
