import * as i18n from '../i18n/index.js';

export function translate(key, lang, vars) {
  return i18n.translate(lang, key, vars);
}
