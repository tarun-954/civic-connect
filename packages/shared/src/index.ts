export type ApiHealth = {
  status: 'ok';
  service: 'api';
  timestamp: string;
};

export function formatIsoTimestamp(date: Date): string {
  return date.toISOString();
}
