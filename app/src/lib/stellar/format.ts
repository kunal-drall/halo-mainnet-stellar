/**
 * Stellar formatting utilities.
 */

/**
 * Convert stroops to XLM display string.
 * 1 XLM = 10,000,000 stroops
 */
export function stroopsToXlm(stroops: number | string): string {
  const num = typeof stroops === "string" ? parseInt(stroops, 10) : stroops;
  return (num / 10_000_000).toFixed(7).replace(/\.?0+$/, "");
}

/**
 * Convert XLM to stroops.
 */
export function xlmToStroops(xlm: number | string): number {
  const num = typeof xlm === "string" ? parseFloat(xlm) : xlm;
  return Math.round(num * 10_000_000);
}

/**
 * Truncate a Stellar address for display: GABC...WXYZ
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a Stellar amount for display with currency symbol.
 */
export function formatStellarAmount(
  stroops: number,
  currency: string = "XLM"
): string {
  const xlm = stroopsToXlm(stroops);
  return `${xlm} ${currency}`;
}

/**
 * Validate a Stellar transaction hash (64 hex characters).
 */
export function isValidTxHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}
