import { defineCollection } from 'codeappscompact/collections';
import { CurrencyCell, NumberCell, PrimarySecondaryCell } from 'codeappscompact/display';
import { fieldPresets } from 'codeappscompact';
import type { DataService, Field } from 'codeappscompact';

export type InventoryDraft = { name: string; sku: string; quantity: number; unitPrice: number; notes: string; revision: number };
export type InventoryRow = InventoryDraft & { id: string };
export const inventoryDefaults: InventoryDraft = { name: '', sku: '', quantity: 0, unitPrice: 0, notes: '', revision: 0 };
export const inventoryFields = [
  { name: 'name', label: 'Item', ...fieldPresets.name },
  { name: 'sku', label: 'SKU', kind: 'text', required: true, pattern: /^[A-Z0-9-]+$/, patternMessage: 'must contain uppercase letters, digits or hyphens.' },
  { name: 'quantity', label: 'Quantity', ...fieldPresets.integer, min: 0, unit: 'items' },
  { name: 'unitPrice', label: 'Unit price', kind: 'number', min: 0, step: 0.01, unit: 'USD' },
  { name: 'notes', label: 'Notes', ...fieldPresets.notes },
] satisfies readonly Field<InventoryDraft>[];
export function inventoryCollection(namespace: string, service: DataService<InventoryRow, InventoryDraft>) {
  return defineCollection({ namespace, id: 'inventory', title: 'Inventory', service, defaults: inventoryDefaults, fields: inventoryFields,
    getId: row => row.id, getLabel: row => row.name, searchText: row => `${row.name} ${row.sku} ${row.notes}`,
    columns: [
      { id: 'name', header: 'Item', render: row => <PrimarySecondaryCell primary={row.name} secondary={row.sku} />, sortValue: row => row.name },
      { id: 'quantity', header: 'Quantity', render: row => <NumberCell value={row.quantity} />, sortValue: row => row.quantity },
      { id: 'price', header: 'Unit price', render: row => <CurrencyCell value={row.unitPrice} currency="USD" />, sortValue: row => row.unitPrice },
    ], mobileLayout: 'cards',
  });
}
