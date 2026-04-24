const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function getChosung(text: string): string {
  return [...text].map((ch) => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHOSUNG[Math.floor(code / 588)];
  }).join('');
}

export function matchesChosung(text: string, query: string): boolean {
  if (text.toLowerCase().includes(query.toLowerCase())) return true;
  const isChosungQuery = [...query].every((ch) => CHOSUNG.includes(ch));
  if (isChosungQuery) return getChosung(text).includes(query);
  return false;
}
