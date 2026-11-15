// Channel names shared by the server (which pokes) and the pages (which listen).
export const ORDERS_CHANNEL = "orders";
export const orderChannelName = (token: string) => `order-${token}`;
export const POKE_EVENT = "changed";
