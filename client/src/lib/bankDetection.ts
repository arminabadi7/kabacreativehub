// Iranian Bank BIN (Bank Identification Number) to Bank Name mapping
export const BANK_BIN_MAP: Record<string, { name: string; code: string }> = {
  "603799": { name: "Bank Melli", code: "melli" },
  "589210": { name: "Bank Sepah", code: "sepah" },
  "627648": { name: "Bank Tose'e Saderat", code: "saderat" },
  "627961": { name: "Bank San'at o Ma'dan", code: "sanat" },
  "603770": { name: "Bank Keshavarzi", code: "keshavarzi" },
  "628023": { name: "Bank Maskan", code: "maskan" },
  "603769": { name: "Bank Saderat", code: "saderat" },
  "627760": { name: "Post Bank", code: "post" },
  "610433": { name: "Bank Mellat", code: "mellat" },
  "627353": { name: "Bank Tejarat", code: "tejarat" },
  "627412": { name: "Bank Eghtesad Novin", code: "eghtesad" },
  "589463": { name: "Bank Refah", code: "refah" },
  "622106": { name: "Bank Parsian", code: "parsian" },
  "502229": { name: "Bank Pasargad", code: "pasargad" },
  "639599": { name: "Bank Ghavamin", code: "ghavamin" },
  "606373": { name: "Mehr Iran Qarz-al-Hasaneh Bank", code: "mehr" },
  "627488": { name: "Bank Karafarin", code: "karafarin" },
  "621986": { name: "Bank Saman", code: "saman" },
  "639346": { name: "Bank Sina", code: "sina" },
  "639607": { name: "Bank Sarmayeh", code: "sarmayeh" },
  "504706": { name: "Bank Shahr", code: "shahr" },
  "502938": { name: "Bank Dey", code: "dey" },
  "502908": { name: "Bank Tose'e Ta'avon", code: "taavon" },
  "507677": { name: "Noor Credit Institution", code: "noor" },
  "606256": { name: "Melal Credit Institution", code: "melal" },
  "505416": { name: "Bank Gardeshgari", code: "gardeshgari" },
};

export function detectBankFromCardNumber(cardNumber: string): { name: string; code: string } | null {
  if (!cardNumber || cardNumber.length < 6) {
    return null;
  }
  
  const bin = cardNumber.substring(0, 6);
  return BANK_BIN_MAP[bin] || null;
}

export function formatShebaNumber(sheba: string): string {
  // Remove any existing IR prefix and spaces
  const cleaned = sheba.replace(/^IR/i, "").replace(/\s/g, "");
  
  // If it's 24 digits, add IR prefix
  if (cleaned.length === 24 && /^\d+$/.test(cleaned)) {
    return `IR${cleaned}`;
  }
  
  // If it already has IR and is valid, return as is
  if (sheba.toUpperCase().startsWith("IR") && cleaned.length === 24) {
    return sheba.toUpperCase();
  }
  
  return sheba;
}

export function formatCardNumber(cardNumber: string): string {
  // Remove all non-digits
  const cleaned = cardNumber.replace(/\D/g, "");
  
  // Format as XXXX-XXXX-XXXX-XXXX
  if (cleaned.length <= 16) {
    return cleaned.match(/.{1,4}/g)?.join("-") || cleaned;
  }
  
  return cardNumber;
}















