export function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}
