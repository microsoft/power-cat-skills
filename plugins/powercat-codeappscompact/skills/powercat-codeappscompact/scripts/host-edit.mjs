export async function verifySavedEdit(page, frameFor, edit) {
  let original; let changed = false; let failure; let verified = false;
  async function openRecord() {
    const frame = await frameFor();
    const form = frame.locator('[data-cc-part="form"][data-cc-dirty][data-cc-saving]');
    await form.waitFor({ state: 'visible', timeout: 10000 });
    if (await form.getAttribute('data-cc-dirty') !== 'false' || await form.getAttribute('data-cc-saving') !== 'false') throw new Error('An existing draft/save is active or its state is unknown. Do not discard it to run a host probe.');
    await frame.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: edit.collection, exact: true }).click();
    await frame.getByRole('heading', { name: edit.collection, exact: true }).waitFor();
    await frame.getByRole('button', { name: `Edit ${edit.recordLabel}`, exact: true }).click();
    const field = frame.getByLabel(edit.field, { exact: true });
    const text = await field.evaluate(element => element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && element.type === 'text'));
    if (!text) throw new Error('The saved-edit probe requires an explicitly bound plain text field.');
    return { frame, field };
  }
  async function save(frame, field, value) {
    await field.fill(value);
    await frame.locator('[data-cc-part="form"]').getByRole('button', { name: 'Save', exact: true }).click();
    await frame.locator('[data-cc-part="saved"]').waitFor();
  }
  try {
    const { frame, field } = await openRecord(); original = await field.inputValue();
    if (original === edit.value) throw new Error('The host probe must change a value using this attempt\'s unique marker.');
    changed = true; await save(frame, field, edit.value);
    await page.reload();
    const reloaded = await openRecord();
    if (await reloaded.field.inputValue() !== edit.value) throw new Error('The saved synthetic edit did not survive host reload.');
    verified = true;
  } catch (error) { failure = error; }
  if (changed) {
    try {
      const current = await openRecord();
      if (await current.field.inputValue() !== edit.value) throw new Error('The probe field changed concurrently; refusing to overwrite the new value during restoration.');
      await save(current.frame, current.field, original);
      await page.reload();
      const restored = await openRecord();
      if (await restored.field.inputValue() !== original) throw new Error('Original field restoration did not survive reload.');
    } catch (error) { throw new AggregateError(failure ? [failure, error] : [error], `Host saved-edit/restoration incomplete: ${[failure, error].filter(Boolean).map(item => item.message).join('; ')}`); }
  }
  if (failure) throw failure;
  if (!verified) throw new Error('The host edit was not verified.');
  return { savedEditReloadVerified: true, restoredOriginalField: true };
}
