import { useState } from 'react';
import { useNavigationGuard } from 'codeappscompact';
import { createTransactionStore, DetailTable, FormField, useTransactionState } from 'codeappscompact/aggregate';
import { RecordFlow } from 'codeappscompact/record-flow';
import { DemoShell } from 'codeappscompact/demo-shell';
import { errorMessage } from 'codeappscompact/validation';
import type { Entry } from './domain.ts';
import { seed, decode, reduce } from './domain.ts';
import HostStatus from './HostStatus.tsx';
import config from './app-config.json';
import 'codeappscompact/aggregate.css';

const store = createTransactionStore(config.storageKey, { seed, decode, reduce });
const users = [{ value: 'demo', label: 'Alex - Coordinator' }, { value: 'reviewer', label: 'Taylor - Manager' }];
export default function App() {
  const data = useTransactionState(store, config.storageKey);
  const navigation = useNavigationGuard();
  const [user, setUser] = useState('demo');
  const [selected, setSelected] = useState<string[]>([]);
  const [cards, setCards] = useState(false);
  const [notice, setNotice] = useState(''); const [problem, setProblem] = useState('');
  async function reset() {
    setProblem('');
    try {
      const expected = data.error || !data.state ? { raw: store.raw() } : { revision: data.state.revision };
      if (!window.confirm('Reset only this app\'s synthetic demo data?')) return;
      await data.reset(expected); setNotice('Demo data reset.');
    } catch (error) { setProblem(errorMessage(error)); }
  }
  return <DemoShell title={config.title} items={[{ id: 'notes', label: 'Notes' }]} activeId="notes" onNavigate={id => { if (id !== 'notes') throw new Error('Unknown screen.'); }} hostStatus={<HostStatus />}
    users={users} user={user} onUserChange={setUser} navigation={navigation}>
    {data.loading && <p role="status">Loading browser-local records...</p>}
    {(data.error || problem) && <div role="alert"><p>{data.error || problem}</p><button type="button" onClick={() => void data.reload()}>Retry loading</button></div>}
    {data.externalChange > 0 && <p role="status">Another tab changed the data. Open drafts are preserved; reopen a stale draft before saving.</p>}
    {notice && <p role="status" data-cc-part="saved">{notice}</p>}
    {data.state && <RecordFlow<Entry, Entry>
      title="Notes" records={data.state.entries} revision={data.state.revision}
      toRow={entry => ({ id: entry.id, label: entry.title, values: { title: entry.title, lines: entry.lines.length } })}
      columns={[{ key: 'title', label: 'Title' }, { key: 'lines', label: 'Lines' }]}
      selected={selected} onSelect={setSelected} onFormStateChange={navigation.onFormStateChange}
      toolbar={<div className="cc-toolbar"><button type="button" aria-pressed={!cards} onClick={() => setCards(false)}>List view</button><button type="button" aria-pressed={cards} onClick={() => setCards(true)}>Cards view</button><span>{selected.length} selected</span></div>}
      alternate={cards ? (rows, open) => <ul>{rows.map(row => <li key={row.id}><button type="button" onClick={() => open(row.id)}>Open {row.label}</button></li>)}</ul> : undefined}
      addLabel="Add note" createDraft={() => ({ id: '', title: '', lines: [] })} editDraft={entry => entry}
      details={entry => <DetailTable title="Lines" columns={['Line']} rows={entry.lines.map(line => [line])} />}
      onSave={async (draft, context) => { await data.commit(context.revision, { id: context.id, title: draft.title, lines: draft.lines }, user); }}
    >{(draft, setDraft) => <>
      <FormField name="title" label="Title" value={draft.title} required onChange={title => setDraft(current => ({ ...current, title }))} />
      <FormField name="lines" label="Lines" multiline value={draft.lines.join('\n')} hint="One nested line per row." onChange={text => setDraft(current => ({ ...current, lines: text.split('\n') }))} />
    </>}</RecordFlow>}
    <button type="button" disabled={data.saving} onClick={() => void reset()}>Reset demo data</button>
  </DemoShell>;
}
