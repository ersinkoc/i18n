'use client';

import { useTranslation, T, NumberFormat } from '@oxog/i18n-react';
import { LanguageSelector } from '../components/LanguageSelector';

export default function HomePage() {
  const { t, formatNumber } = useTranslation();

  const stats = [
    { key: 'downloads', count: 1234567 },
    { key: 'stars', count: 8432 },
    { key: 'users', count: 12543 },
    { key: 'countries', count: 127 },
  ];

  const features = [
    { key: 'performance', improvement: 90 },
    { key: 'typesafe' },
    { key: 'lightweight', size: 5 },
    { key: 'modern', reactVersion: '18' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">
              <T id="site.title" />
            </h1>
            <div className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <T id="navigation.home" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <T id="navigation.about" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <T id="navigation.products" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <T id="navigation.contact" />
              </a>
            </div>
          </div>
          <LanguageSelector />
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <T id="home.hero.title" />
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            <T id="home.hero.subtitle" />
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <T id="home.hero.cta" />
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <T id="home.hero.learnMore" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ key, count }) => (
            <div key={key} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <NumberFormat value={count} format="compact" />
              </div>
              <div className="text-gray-600">
                <T id={`home.stats.${key}` as any} values={{ count }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            <T id="home.features.title" />
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(({ key, ...values }) => (
            <div key={key} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3">
                <T id={`home.features.${key}.title` as any} />
              </h3>
              <p className="text-gray-600">
                <T id={`home.features.${key}.description` as any} values={values} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of developers who have already switched to @oxog/i18n for their internationalization needs.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            <T id="home.hero.cta" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <T id="footer.copyright" values={{ year: new Date().getFullYear(), company: '@oxog/i18n' }} />
        </div>
      </footer>
    </div>
  );
}