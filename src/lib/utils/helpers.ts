export function generateRegistrationId(year: number, sequence: number): string {
  const padded = String(sequence).padStart(3, "0");
  return `CATUR${year}-${padded}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}
