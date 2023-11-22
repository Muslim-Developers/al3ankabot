// Borrowed from https://www.30secondsofcode.org/js/s/levenshtein-distance/
export function levenshteinDistance(s: string, t: string) {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr: number[][] = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              // 2 instead of 1 to penalize substitutions more than additions/deletions
              arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 2),
            );
    }
  }
  return arr[t.length][s.length];
}
