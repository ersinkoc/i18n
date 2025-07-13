import { useTranslation } from '@oxog/i18n-react';
import { supportedLocales } from '../lib/i18n';

const localeNames = {
  en: 'English',
  es: 'Español',
} as const;

export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="language-selector">
      <label htmlFor="language-select" className="sr-only">
        {t('navigation.language')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="bg-transparent border border-gray-300 rounded px-2 py-1 text-sm"
        aria-label={t('navigation.language')}
      >
        {supportedLocales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}