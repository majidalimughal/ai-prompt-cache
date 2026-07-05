const WHITESPACE_REGEX = /\s+/g;

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(WHITESPACE_REGEX, ' ');
}

export function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return normalizeWhitespace(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (typeof value === 'object') {
    return normalizeObject(value as Record<string, unknown>);
  }

  return value;
}

export function normalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    }
    result[key] = normalizeValue(val);
  }

  return result;
}

export function normalizeMessages(
  messages: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return messages.map((message) => normalizeObject(message));
}
