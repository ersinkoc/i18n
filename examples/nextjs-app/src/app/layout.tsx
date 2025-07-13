import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '@oxog/i18n-react';
import { i18n } from '../lib/i18n';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js with @oxog/i18n',
  description: 'A complete example of internationalization in Next.js',
  keywords: 'nextjs, i18n, internationalization, typescript, zero-dependencies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <I18nProvider i18n={i18n}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}