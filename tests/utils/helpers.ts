export function generateUniqueEmail() {
  return `test_${Date.now()}@example.com`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}