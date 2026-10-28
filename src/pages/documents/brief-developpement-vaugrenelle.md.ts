// Brief de développement téléchargeable, généré au build depuis CLAUDE.md (source unique)
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET() {
  const text = await readFile(join(process.cwd(), 'CLAUDE.md'), 'utf-8');
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
