import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const caches = {};

function loadPack(lang) {
  if (!caches[lang]) {
    const filePath = path.join(__dirname, `${lang}.json`);
    const raw = readFileSync(filePath, 'utf8');
    caches[lang] = JSON.parse(raw);
  }
  return caches[lang];
}

export function translate(lang, key, vars = {}) {
  const pack = loadPack(lang) ?? loadPack('en');
  let text = pack[key];
  if (text === undefined) {
    text = loadPack('en')[key] ?? key;
  }
  return text.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}
