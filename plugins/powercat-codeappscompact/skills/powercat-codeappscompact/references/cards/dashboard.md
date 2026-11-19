# Dashboard

For static/actionable summaries **import** `MetricGrid`, `SummaryCard`, `AttentionList` from `codeappscompact/display`; **API:** `display`.

```tsx
<MetricGrid items={[{ id: 'open', title: 'Open records', value: openCount }]} />
```

Supply current derived values, labels, semantic tones and optional real `onActivate` actions. Read [shell](shell.md) before wiring drill-down navigation. Global metrics do not change with a list filter unless explicitly required. Color never replaces status text.

The DIFFERENT `MetricGrid` from `codeappscompact/aggregate` uses `metrics: [{label,value,onOpen}]`, with mandatory actions. Do not mix these APIs or invent no-op `onOpen` callbacks for static metrics. It needs aggregate styles. No chart engine or data calculation is bundled here.
