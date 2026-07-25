/** Display helpers shared across screens, so formatting never drifts page to page. */

/** Paise are shown only when there are any, so round prices stay clean. */
export function formatCurrency(amount: number): string {
  const value = Math.round((amount + Number.EPSILON) * 100) / 100;
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** e.g. "24 Jul 2026". Returns an empty string for a missing/unparseable date. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${formatDate(value)}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

/** "placed" / "out_for_delivery" → "Placed" / "Out For Delivery". */
export function humanizeStatus(status: string | null | undefined): string {
  if (!status) return '';
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}
