# Optional display controls

Import from `codeappscompact/display`; load `codeappscompact/theme.css` once or use the stable data hooks in your theme. No extra dependency or domain status registry is required.

```tsx
<MetricGrid items={[
  { id: 'open', title: 'Open requests', value: openCount, tone: 'info',
    onActivate: () => guard.requestNavigation(() => navigate('requests')) },
]} />
<StatusBadge tone="warning">Needs review</StatusBadge>
<PrimarySecondaryCell primary={row.name} secondary={row.notes} />
<CurrencyCell value={row.price} currency="USD" locale="en-US" />
<UtcCell value={row.dueUtc} locale="en-GB" />
<ProgressCell value={row.progress} max={100} label={`${row.name} progress`} />
```

`SummaryCard({title,value,detail?,tone?,onActivate?})` is static unless an action is supplied; actions render actual buttons. `MetricGrid` accepts these props plus unique item IDs. `AttentionList({items,label?,emptyMessage?})` uses `{id,message,tone?,action?:{label,onActivate}}` items. Route actions through the app's navigation guard; components cannot protect arbitrary parent remounts.

`StatusBadge` renders text/children with `neutral|info|success|warning|danger`. Apps own status-to-tone mappings; color never replaces the label. Theme variables include `--cc-info(-bg)`, `--cc-success(-bg)`, `--cc-warning(-bg)`, `--cc-danger(-bg)`. Maintain contrast when overriding.

`NumberCell({value,locale?,options?})` uses Intl.NumberFormat and rejects nonfinite inputs. `CurrencyCell` requires a currency. `DateTimeCell({value,timeZone,locale?,options?})` requires an offset-qualified instant and explicit time zone; `UtcCell` pins UTC. Formatting uses the caller's locale or the browser's locale. Domain validation still owns date correctness. `ProgressCell` rejects missing labels, nonpositive maxima and out-of-range values; it never silently clamps.

`RecordScreen mobileLayout="cards"` shows labeled cards at 600px and below, using the SAME column renderers. The table remains the desktop view. Sorting is available through the accessible Sort records control in both layouts. The default stays the horizontally scrollable table for compatibility.

Stable hooks: `data-cc` values `status-badge`, `primary-secondary`, `number-cell`, `date-cell`, `progress-cell`, `summary-card`, `metric-grid`, `attention-list`; `data-cc-tone` declares a semantic tone. New record parts include `filters`, `sort-controls`, `record-cards`, `error-summary`. Use named hooks, not copied markup, nth-child selectors or assumptions about column order.
