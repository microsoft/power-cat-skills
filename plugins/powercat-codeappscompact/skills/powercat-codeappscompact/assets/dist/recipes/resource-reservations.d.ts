export type Reservation = {
    id: string;
    resources: readonly string[];
    startUtc: string;
    endUtc: string;
};
export type ReservationConflict = {
    id: string;
    resources: string[];
    overlapStartUtc: string;
    overlapEndUtc: string;
};
export declare function reservationConflicts(candidate: Reservation, existing: readonly Reservation[], bufferMs?: number): ReservationConflict[];
