/**
 * Arabic text utilities for speech recognition comparison.
 */

/**
 * Unicode ranges for Arabic diacritics (harakat/tashkeel):
 * - Fathah, Dammah, Kasrah, Sukun, Shadda, etc.
 * - Small alef, superscript alef
 * - Maddah, hamza marks
 */
const HARAKAT_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\uFE70-\uFE7F]/g;

/**
 * Remove all harakat (diacritical marks) from Arabic text.
 * This normalizes both Quran text (which has full tashkeel)
 * and speech recognition output (which typically has none).
 */
export function stripHarakat(text: string): string {
  return text.replace(HARAKAT_REGEX, '');
}

/**
 * Normalize Arabic text for comparison:
 * - Strip harakat
 * - Normalize alef variants (أ إ آ ٱ → ا)
 * - Normalize taa marbuta (ة → ه)
 * - Normalize alef maqsura (ى → ي)
 * - Remove tatweel (kashida ـ)
 * - Collapse whitespace
 */
export function normalizeArabic(text: string): string {
  return stripHarakat(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
