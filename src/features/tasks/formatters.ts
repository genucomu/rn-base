const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

const timestampFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour12: false,
});

const NO_DATA = 'Sin datos';

export function formatCents(amountCents: unknown): string {
  if (typeof amountCents !== 'number' || !Number.isFinite(amountCents)) {
    return NO_DATA;
  }

  return currencyFormatter.format(amountCents / 100);
}

export function formatIsoTimestamp(timestamp: unknown): string {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    return NO_DATA;
  }

  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    return NO_DATA;
  }

  try {
    const parts = timestampFormatter.formatToParts(date);
    const values = Object.fromEntries(
      parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]),
    );

    return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`;
  } catch {
    return NO_DATA;
  }
}
