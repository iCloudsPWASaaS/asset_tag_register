export function formatTag(number: number) {
  return `AT-${String(Math.max(1, number)).padStart(6, "0")}`;
}

export function parseTagNumber(tag: string | null | undefined) {
  if (!tag) return 0;
  const match = tag.match(/(\d+)\s*$/);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

export function nextTagNumberFromTags(tags: string[]) {
  return tags.reduce((max, tag) => Math.max(max, parseTagNumber(tag)), 0) + 1;
}
