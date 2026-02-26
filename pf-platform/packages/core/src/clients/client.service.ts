import type { Client } from '@pf/shared';

export function getClientDisplayName(client: Client): string {
  if (client.entityName) return `${client.entityName} (${client.fullName})`;
  return client.fullName;
}

export function validateAbn(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');
  if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 89 === 0;
}
