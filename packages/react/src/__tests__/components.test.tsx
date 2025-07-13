import { createI18n } from '@oxog/i18n';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DateFormat, NumberFormat, RelativeTime, T, Trans } from '../components';
import { I18nProvider } from '../context';

interface TestMessages {
  greeting: 'Hello!';
  welcome: 'Welcome {{name}}!';
  items: {
    count: {
      zero: 'No items';
      one: 'One item';
      other: '{{count}} items';
    };
  };
  complex: 'Click <0>here</0> to continue';
}

const i18n = createI18n<TestMessages>({
  locale: 'en',
  messages: {
    en: {
      greeting: 'Hello!',
      welcome: 'Welcome {{name}}!',
      items: {
        count: {
          zero: 'No items',
          one: 'One item',
          other: '{{count}} items',
        },
      },
      complex: 'Click <0>here</0> to continue',
    },
  },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

describe('T Component', () => {
  it('should render simple translations', () => {
    render(
      <TestWrapper>
        <T id="greeting" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('should render translations with parameters', () => {
    render(
      <TestWrapper>
        <T id="welcome" values={{ name: 'John' }} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Welcome John!')).toBeInTheDocument();
  });

  it('should render with custom element', () => {
    render(
      <TestWrapper>
        <T id="greeting" as="h1" />
      </TestWrapper>
    );
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello!');
  });

  it('should apply className', () => {
    render(
      <TestWrapper>
        <T id="greeting" className="test-class" />
      </TestWrapper>
    );
    
    const element = screen.getByText('Hello!');
    expect(element).toHaveClass('test-class');
  });

  it('should handle nested keys', () => {
    render(
      <TestWrapper>
        <T id="items.count" values={{ count: 5 }} />
      </TestWrapper>
    );
    
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('should handle pluralization', () => {
    const { rerender } = render(
      <TestWrapper>
        <T id="items.count" values={{ count: 0 }} />
      </TestWrapper>
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
    
    rerender(
      <TestWrapper>
        <T id="items.count" values={{ count: 1 }} />
      </TestWrapper>
    );
    
    expect(screen.getByText('One item')).toBeInTheDocument();
  });
});

describe('Trans Component', () => {
  it('should render complex translations with components', () => {
    render(
      <TestWrapper>
        <Trans
          id="complex"
          components={{
            '0': <a href="/continue" data-testid="link" />,
          }}
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('Click')).toBeInTheDocument();
    expect(screen.getByText('to continue')).toBeInTheDocument();
    expect(screen.getByTestId('link')).toBeInTheDocument();
  });

  it('should handle nested components', () => {
    const i18nComplex = createI18n({
      locale: 'en',
      messages: {
        en: {
          nested: 'This is <0>bold <1>italic</1> text</0>',
        },
      },
    });

    render(
      <I18nProvider i18n={i18nComplex}>
        <Trans
          id="nested"
          components={{
            '0': <strong data-testid="bold" />,
            '1': <em data-testid="italic" />,
          }}
        />
      </I18nProvider>
    );
    
    expect(screen.getByTestId('bold')).toBeInTheDocument();
    expect(screen.getByTestId('italic')).toBeInTheDocument();
  });

  it('should apply custom element and className', () => {
    render(
      <TestWrapper>
        <Trans
          id="complex"
          as="div"
          className="complex-trans"
          components={{
            '0': <a href="/continue" />,
          }}
        />
      </TestWrapper>
    );
    
    const container = screen.getByText('Click').closest('div');
    expect(container).toHaveClass('complex-trans');
  });
});

describe('NumberFormat Component', () => {
  it('should format numbers', () => {
    render(
      <TestWrapper>
        <NumberFormat value={1234.56} />
      </TestWrapper>
    );
    
    expect(screen.getByText('1,234.56')).toBeInTheDocument();
  });

  it('should format with custom format', () => {
    const i18nWithFormats = createI18n({
      locale: 'en',
      messages: { en: {} },
      formats: {
        number: {
          currency: { style: 'currency', currency: 'USD' },
        },
      },
    });

    render(
      <I18nProvider i18n={i18nWithFormats}>
        <NumberFormat value={1234.56} format="currency" />
      </I18nProvider>
    );
    
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('should apply custom element and className', () => {
    render(
      <TestWrapper>
        <NumberFormat value={123} as="strong" className="number" />
      </TestWrapper>
    );
    
    const element = screen.getByText('123');
    expect(element.tagName).toBe('STRONG');
    expect(element).toHaveClass('number');
  });
});

describe('DateFormat Component', () => {
  it('should format dates', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    
    render(
      <TestWrapper>
        <DateFormat value={date} />
      </TestWrapper>
    );
    
    // Date formatting can vary by locale and browser
    expect(screen.getByText(/2024|Jan|15/)).toBeInTheDocument();
  });

  it('should format with custom format', () => {
    const i18nWithFormats = createI18n({
      locale: 'en',
      messages: { en: {} },
      formats: {
        date: {
          short: { dateStyle: 'short' },
        },
      },
    });

    const date = new Date('2024-01-15T12:00:00Z');
    
    render(
      <I18nProvider i18n={i18nWithFormats}>
        <DateFormat value={date} format="short" />
      </I18nProvider>
    );
    
    expect(screen.getByText(/2024|Jan|15/)).toBeInTheDocument();
  });

  it('should apply custom element and className', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    
    render(
      <TestWrapper>
        <DateFormat value={date} as="time" className="date" />
      </TestWrapper>
    );
    
    const element = screen.getByText(/2024|Jan|15/);
    expect(element.tagName).toBe('TIME');
    expect(element).toHaveClass('date');
  });
});

describe('RelativeTime Component', () => {
  it('should format relative time', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    render(
      <TestWrapper>
        <RelativeTime value={yesterday} baseDate={now} />
      </TestWrapper>
    );
    
    expect(screen.getByText('yesterday')).toBeInTheDocument();
  });

  it('should use current time as default base', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    render(
      <TestWrapper>
        <RelativeTime value={oneHourAgo} />
      </TestWrapper>
    );
    
    expect(screen.getByText(/hour|ago/)).toBeInTheDocument();
  });

  it('should handle future dates', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    render(
      <TestWrapper>
        <RelativeTime value={tomorrow} baseDate={now} />
      </TestWrapper>
    );
    
    expect(screen.getByText('tomorrow')).toBeInTheDocument();
  });

  it('should apply custom element and className', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    render(
      <TestWrapper>
        <RelativeTime value={yesterday} baseDate={now} as="span" className="relative" />
      </TestWrapper>
    );
    
    const element = screen.getByText('yesterday');
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('relative');
  });
});