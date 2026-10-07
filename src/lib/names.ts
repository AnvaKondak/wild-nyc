// Neighbors' names inside sentences: "the robins", "the Canada geese", "the white-tailed
// deer's fall". Lowercased like ordinary words, except the parts that are names.

const PROPER = new Set(['canada', "cooper's", 'baltimore', 'carolina', 'virginia']);

/** "Canada Geese" → "Canada geese"; "Blue Jays" → "blue jays". */
export function lowerName(name: string): string {
  return name
    .split(' ')
    .map((word) => (PROPER.has(word.toLowerCase()) ? word : word.toLowerCase()))
    .join(' ');
}

/** "robins" → "robins'"; "white-tailed deer" → "white-tailed deer's". */
export function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}
