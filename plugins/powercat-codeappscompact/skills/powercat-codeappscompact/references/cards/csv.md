# CSV

**Import:** `parseCsv`, `toCsv`, `downloadCsv` from `codeappscompact/aggregate`; **API:** `csv`. Aggregate table export already uses these; no extra export implementation is needed.

```ts
downloadCsv('records.csv', toCsv(['Name'], filteredRecords.map(row => [row.name])));
const cells = parseCsv(importText);
```

Helpers preserve quoted, comma-containing and multiline cells. For export, load no persistence/import docs. For import, read [save](../contracts/save.md) and the chosen [data contract](../contracts/data.md): app owns headers, row/type/size checks, duplicates (file and stored records), preview and ONE all-or-nothing command. Reject the entire invalid batch; never write during preview.

Not an import wizard or transactional importer. Spreadsheet formula neutralization is not promised; treat raw cells as text or implement the explicitly required export policy. Preserve rejected import input and show useful row errors.
