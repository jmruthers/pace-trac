const HTML_TAG_PATTERN = /<[^>]+>/;

/** Escape text for safe display when content may contain angle brackets. */
export function escapeJournalContentForDisplay(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Split journal content into display paragraphs (plain text; no HTML rendering).
 */
export function formatJournalContentForDisplay(content: string): string[] {
  const trimmed = content.trim();
  if (trimmed === '') return [];
  const normalised = HTML_TAG_PATTERN.test(trimmed)
    ? escapeJournalContentForDisplay(trimmed)
    : trimmed;
  return normalised.split(/\n{2,}/).map((block) => block.trim()).filter((block) => block !== '');
}
