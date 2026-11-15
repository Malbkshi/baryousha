/** Contact details shown around the site. One place to change them. */
export const CAFE = {
  nameAr: "مقهى البريوشة",
  nameEn: "Albaryosha Café",
  address: "طرابلس، السياحية",
  phone: "091 123 4567",
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;
