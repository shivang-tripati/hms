const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  }
  return (
    ones[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 !== 0 ? " " + convertGroup(n % 100) : "")
  );
}

/**
 * Converts a number to Indian currency words.
 * E.g. 165200 → "One Lakh Sixty Five Thousand Two Hundred"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const isNegative = num < 0;
  num = Math.abs(Math.floor(num));

  // Indian numbering: Crores, Lakhs, Thousands, Hundreds
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  const parts: string[] = [];
  if (crore > 0) parts.push(convertGroup(crore) + " Crore");
  if (lakh > 0) parts.push(convertGroup(lakh) + " Lakh");
  if (thousand > 0) parts.push(convertGroup(thousand) + " Thousand");
  if (remainder > 0) parts.push(convertGroup(remainder));

  const words = parts.join(" ");
  return (isNegative ? "Minus " : "") + words;
}

/**
 * Formats currency amount to words with "Rupees" prefix and paise suffix.
 * E.g. 165200.50 → "Rupees: One Lakh Sixty Five Thousand Two Hundred and Fifty Paise Only."
 */
export function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = "Rupees: " + numberToWords(rupees);
  if (paise > 0) {
    result += " and " + numberToWords(paise) + " Paise";
  }
  result += " Only.";
  return result;
}
