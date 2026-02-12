export function chunkText(text, chunkSize = 500) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}
