import { describe, it, expect } from 'vitest';
import {
  escapeJournalContentForDisplay,
  formatJournalContentForDisplay,
} from '@/utils/journal-content';

describe('journal-content', () => {
  it('escapes HTML-like content', () => {
    expect(escapeJournalContentForDisplay('<script>x</script>')).toBe(
      '&lt;script&gt;x&lt;/script&gt;'
    );
  });

  it('splits paragraphs on blank lines', () => {
    expect(formatJournalContentForDisplay('Line one\n\nLine two')).toEqual(['Line one', 'Line two']);
  });

  it('returns empty array for blank content', () => {
    expect(formatJournalContentForDisplay('   ')).toEqual([]);
  });

  it('escapes HTML tags when formatting blocks', () => {
    const blocks = formatJournalContentForDisplay('<b>Hi</b>');
    expect(blocks).toEqual(['&lt;b&gt;Hi&lt;/b&gt;']);
  });
});
