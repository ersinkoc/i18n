import { I18nProvider } from '@oxog/i18n-react';
import { LanguageSelector } from './components/LanguageSelector';
import { Demo } from './components/Demo';
import { i18n } from './i18n';

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <div className="container">
        <LanguageSelector />
        <Demo />
      </div>
    </I18nProvider>
  );
}

export default App;