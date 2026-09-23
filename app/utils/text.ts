export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split('_')
    .map(word => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}