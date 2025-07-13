import { useTranslation } from '@oxog/i18n-react';

export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();
  
  return (
    <div className="language-selector">
      <label>{t('language.select')}: </label>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
      <p>{t('language.current', { lang: locale })}</p>
    </div>
  );
}