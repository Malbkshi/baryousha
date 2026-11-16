export type OrderStatus = "new" | "preparing" | "ready" | "done" | "cancelled";

/** A line as it was sold: name and price are copied from the menu at order time. */
export type OrderLine = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  number: number;
  /** Unguessable handle the customer uses to follow the order. */
  token: string;
  /** Sent by the browser so a retried submit does not create a second order. */
  clientRef: string;
  customerName: string;
  phone: string;
  /** "HH:MM" today in Tripoli, or null for "as soon as possible". */
  pickupTime: string | null;
  note: string;
  status: OrderStatus;
  items: OrderLine[];
  total: number;
  etaAt: string | null;
  createdAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  doneAt: string | null;
  cancelledAt: string | null;
};

/** What the customer's tracking page may see. No phone number. */
export type PublicOrder = Omit<Order, "id" | "phone" | "clientRef">;

export type Settings = {
  acceptingOrders: boolean;
  /** "HH:MM". The same time for both means open all day. */
  openTime: string;
  /** "HH:MM". Earlier than openTime means the café closes after midnight. */
  closeTime: string;
  /** Close for each of the five daily prayers. */
  prayerBreaks: boolean;
  /** Minutes before the prayer time that the café closes. */
  minutesBefore: number;
  /** Minutes after the prayer time that the café opens again. */
  minutesAfter: number;
};

export const DEFAULT_SETTINGS: Settings = {
  acceptingOrders: true,
  openTime: "00:00",
  closeTime: "00:00",
  prayerBreaks: true,
  minutesBefore: 10,
  minutesAfter: 40,
};

export const PRAYER_MINUTES_LIMIT = { before: 60, after: 120 } as const;

export const LIMITS = {
  maxLines: 20,
  maxQtyPerLine: 20,
  maxActivePerPhone: 2,
  nameMin: 2,
  nameMax: 40,
  noteMax: 200,
  minLeadMinutes: 10,
} as const;

export const ETA_CHOICES = [5, 10, 15, 20] as const;

export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];
