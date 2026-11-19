# UTC schedule

**Import:** `Calendar`, `utcWeek` from `codeappscompact/aggregate`; **API:** `views`. Load aggregate styles.

```tsx
<Calendar title="Schedule" entries={entries} initialDate={weekDate}
  onOpen={openBooking} actionLabel="Open booking" />
```

Entries are `{id,title,start,end,detail?,status?}` using valid UTC intervals. Includes weekly/agenda views, phone-friendly agenda default and placement across midnight. The app supplies filtered entries, labels, actual open action and current data.

Read [shell](shell.md) for navigation. A read-only calendar does not need reservation-policy docs. When creating bookings, load only the [date/reservation recipes](../recipes.md) and selected [write contract](../contracts/data.md). Caller owns eligibility, active status, overlaps and user-time-zone conversion. UTC-only display is not a local-zone scheduler; no live availability or reservation engine is implied.
