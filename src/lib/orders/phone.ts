const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_ZERO = 0x06f0;

function toAsciiDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9) {
      out += String(code - ARABIC_INDIC_ZERO);
    } else if (code >= EASTERN_ARABIC_ZERO && code <= EASTERN_ARABIC_ZERO + 9) {
      out += String(code - EASTERN_ARABIC_ZERO);
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Libyan mobile numbers, however they were typed, as "09XXXXXXXX".
 * Returns null for anything that is not one.
 */
export function normalizePhone(input: string): string | null {
  let digits = toAsciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("00218")) digits = digits.slice(5);
  else if (digits.startsWith("218")) digits = digits.slice(3);
  if (digits.length === 9 && digits.startsWith("9")) digits = `0${digits}`;
  return /^09[1-5]\d{7}$/.test(digits) ? digits : null;
}
