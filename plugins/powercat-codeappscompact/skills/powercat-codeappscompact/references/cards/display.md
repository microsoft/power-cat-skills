# Display cells

**Import:** `StatusBadge`, `PrimarySecondaryCell`, `NumberCell`, `CurrencyCell`, `DateTimeCell`, `UtcCell`, `ProgressCell` from `codeappscompact/display`; **API:** `display`. Load theme once.

```tsx
<StatusBadge tone="warning">Needs review</StatusBadge>
<CurrencyCell value={amount} currency="USD" locale="en-US" />
<UtcCell value={startUtc} />
```

`StatusBadge` takes its text as children, not a `label` prop. Use the typed example above unchanged except for the actual text and tone; do not invent compatibility props.

Configure labels, semantic tone, locale, currency and explicit time zone. Numeric controls reject nonfinite values; progress rejects unlabeled/out-of-range inputs. `DateTimeCell` needs an offset-qualified instant and `timeZone`; it is not a local date-only formatter. Domain rounding and date semantics remain app-owned.

Use in detail/flat React cells, not in aggregate `TableColumn.format`, which returns a string. Keep text alternatives and contrast when changing theme tokens; do not silently clamp invalid data.
