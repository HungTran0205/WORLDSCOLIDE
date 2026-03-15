export function GoldDisplay({ amount }: { amount: number }) {
  return <span className="gold-display">{Math.floor(amount).toLocaleString()} G</span>;
}
