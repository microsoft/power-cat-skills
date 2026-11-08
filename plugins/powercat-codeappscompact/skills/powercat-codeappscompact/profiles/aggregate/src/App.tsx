import { useState } from 'react';
import { AppShell } from 'codeappscompact';
import { createTransactionStore, DataTable, DraftDialog, FormField, useTransactionState } from 'codeappscompact/aggregate';
import { errorMessage } from 'codeappscompact/validation';
import type { Entry } from './domain.ts';
import { seed, decode, reduce } from './domain.ts';
import HostStatus from './HostStatus.tsx';
import config from './app-config.json';
import 'codeappscompact/aggregate.css';

const store = createTransactionStore(config.storageKey, { seed, decode, reduce });
export default function App() {
  const data = useTransactionState(store, config.storageKey);
  const [editor, setEditor] = useState<{ initial: Entry; revision: string; key: string } | null>(null);
  const [notice, setNotice] = useState(''); const [problem, setProblem] = useState('');
  function open(id?: string) {
    if (!data.state) return;
    const entry = id ? data.state.entries.find(item => item.id === id) : { id: '', title: '', lines: [] };
    if (!entry) throw new Error('The selected note is missing.');
    setEditor({ initial: structuredClone(entry), revision: data.state.revision, key: crypto.randomUUID() });
  }
  async function reset() {
    setProblem('');
    try {
      const expected = data.error || !data.state ? { raw: store.raw() } : { revision: data.state.revision };
      if (!window.confirm('Reset only this app\'s synthetic demo data?')) return;
      await data.reset(expected); setNotice('Demo data reset.');
    } catch (error) { setProblem(errorMessage(error)); }
  }
  return <AppShell title={config.title} subtitle="Aggregate starter - replace the neutral notes with your domain" items={[{ id: 'notes', label: 'Notes' }]} activeId="notes" onNavigate={id => { if (id !== 'notes') throw new Error('Unknown screen.'); }} hostStatus={<HostStatus />}>
    {data.loading && <p role="status">Loading browser-local records...</p>}
    {(data.error || problem) && <div role="alert"><p>{data.error || problem}</p><button type="button" onClick={() => void data.reload()}>Retry loading</button></div>}
    {data.externalChange > 0 && <p role="status">Another tab changed the data. Open drafts are preserved; reopen a stale draft before saving.</p>}
    {notice && <p role="status" data-cc-part="saved">{notice}</p>}
    {data.state && <DataTable title="Notes" rows={data.state.entries.map(entry => ({ id: entry.id, label: entry.title, values: { title: entry.title, lines: entry.lines.length } }))} columns={[{ key: 'title', label: 'Title' }, { key: 'lines', label: 'Lines' }]} onAdd={() => open()} addLabel="Add note" onOpen={id => open(id)} />}
    <button type="button" disabled={data.saving} onClick={() => void reset()}>Reset demo data</button>
    {editor && <DraftDialog key={editor.key} title={editor.initial.id ? 'Edit note' : 'Add note'} initial={editor.initial} onClose={() => setEditor(null)} onSave={async draft => {
      await data.commit(editor.revision, { id: draft.id || undefined, title: draft.title, lines: draft.lines }, 'demo');
      setNotice('Saved.');
    }}>{(draft, setDraft) => <>
      <FormField name="title" label="Title" value={draft.title} required onChange={title => setDraft(current => ({ ...current, title }))} />
      <FormField name="lines" label="Lines" multiline value={draft.lines.join('\n')} hint="One nested line per row." onChange={text => setDraft(current => ({ ...current, lines: text.split('\n') }))} />
    </>}</DraftDialog>}
  </AppShell>;
}
