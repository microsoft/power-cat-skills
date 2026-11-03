import { ValidationError } from 'codeappscompact';
import type { DemoMutation, DemoState } from 'codeappscompact/demo';
import { assertFutureDate, assertDateRange } from 'codeappscompact/recipes/date-policy';
import { reservationConflicts } from 'codeappscompact/recipes/resource-reservations';

export type Booking = { name: string; resourceId: string; startUtc: string; endUtc: string; revision: number };
export type BookingDrafts = { bookings: Booking };
export type BookingState = DemoState<BookingDrafts>;
export function validateBookingStructure(state: BookingState) {
  for (const row of state.bookings) assertDateRange(row.startUtc, row.endUtc, { endField: 'endUtc' });
}
export function bookingMutationPolicy(now: () => number) {
  return ({ next, previous, id }: DemoMutation<BookingDrafts>) => {
    const row = next.bookings.find(item => item.id === id);
    if (!row) throw new Error('The mutated booking was not found.');
    const old = previous.bookings.find(item => item.id === id);
    assertFutureDate(row.startUtc, { now, field: 'startUtc', previousValue: old?.startUtc });
    const reservations = next.bookings.map(item => ({ id: item.id, resources: [item.resourceId], startUtc: item.startUtc, endUtc: item.endUtc }));
    const conflicts = reservationConflicts({ id: row.id, resources: [row.resourceId], startUtc: row.startUtc, endUtc: row.endUtc }, reservations);
    if (conflicts.length) throw new ValidationError<Booking>({ resourceId: `Resource already reserved by ${conflicts.map(conflict => conflict.id).join(', ')}.` });
  };
}
