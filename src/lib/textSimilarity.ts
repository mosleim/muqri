/**
 * Text similarity utilities for comparing speech recognition
 * output against Quran ayat text.
 */

import { normalizeArabic } from './arabicUtils';

/**
 * Tokenize Arabic text into words.
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Calculate token overlap ratio between two Arabic texts.
 * Returns a value between 0 and 1.
 *
 * This compares normalized word tokens and counts how many
 * words from the transcript appear in the target text.
 */
export function tokenOverlap(transcript: string, target: string): number {
  const tTokens = tokenize(normalizeArabic(transcript));
  const aTokens = tokenize(normalizeArabic(target));

  if (aTokens.length === 0 || tTokens.length === 0) return 0;

  const targetSet = new Set(aTokens);
  let matches = 0;

  for (const word of tTokens) {
    if (targetSet.has(word)) {
      matches++;
    }
  }

  // Ratio of matched transcript words against target word count
  return matches / aTokens.length;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Calculate normalized similarity using Levenshtein distance.
 * Returns a value between 0 and 1 (1 = identical).
 */
export function levenshteinSimilarity(transcript: string, target: string): number {
  const a = normalizeArabic(transcript);
  const b = normalizeArabic(target);
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Combined similarity score using both token overlap and Levenshtein.
 * Weighted average: 60% token overlap + 40% Levenshtein.
 */
export function combinedSimilarity(transcript: string, target: string): number {
  const overlap = tokenOverlap(transcript, target);
  const lev = levenshteinSimilarity(transcript, target);
  return 0.6 * overlap + 0.4 * lev;
}
