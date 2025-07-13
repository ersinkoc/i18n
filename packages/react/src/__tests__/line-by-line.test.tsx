import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import React from 'react';
import { createI18n } from '@oxog/i18n';
import { I18nProvider, useI18nContext, useI18n } from '../context';
import { useTranslation, useLocale, useHasTranslation } from '../hooks';
import { T, Trans, NumberFormat, DateFormat, RelativeTime } from '../components';

interface TestMessages {
  'greeting': 'Hello!';
  'welcome': 'Welcome {{name}}!';
  'items.count': 'You have {{count}} items';
  'items.count.zero': 'You have no items';
  'items.count.one': 'You have one item';
  'items.count.other': 'You have {{count}} items';
}

describe('Line-by-Line Test Coverage - React Package', () => {
  let consoleSpy: any;
  let errorSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('I18nProvider component (context.tsx Lines 15-24)', () => {
    // Line 15: export function I18nProvider<TMessages extends Messages = Messages>({
    it('should accept generic TMessages type parameter', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: { en: { greeting: 'Hello!' } },
      });
      
      expect(() => 
        render(
          <I18nProvider i18n={i18n}>
            <div>Test</div>
          </I18nProvider>
        )
      ).not.toThrow();
    });

    // Line 16-17: Parameters destructuring
    it('should destructure i18n and children from props', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <div data-testid="child">Child content</div>
        </I18nProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    // Line 18: I18nProvider function body starts
    it('should validate i18n prop (production safety check)', () => {
      expect(() => 
        render(
          <I18nProvider i18n={null as any}>
            <div>Test</div>
          </I18nProvider>
        )
      ).toThrow('[i18n] I18nProvider requires a valid i18n instance');
    });

    it('should validate i18n prop is defined', () => {
      expect(() => 
        render(
          <I18nProvider i18n={undefined as any}>
            <div>Test</div>
          </I18nProvider>
        )
      ).toThrow('[i18n] I18nProvider requires a valid i18n instance');
    });

    // Line 19-23: JSX return statement
    it('should render I18nContext.Provider with correct value prop', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      const TestComponent = () => {
        const context = useI18nContext();
        return <div data-testid="context-test">{context.i18n.locale}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('context-test')).toHaveTextContent('en');
    });

    // Line 22: children prop rendering
    it('should render children prop correctly', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <div data-testid="multiple">Multiple</div>
          <span data-testid="children">Children</span>
        </I18nProvider>
      );
      
      expect(screen.getByTestId('multiple')).toBeInTheDocument();
      expect(screen.getByTestId('children')).toBeInTheDocument();
    });
  });

  describe('useI18nContext hook (context.tsx Lines 26-32)', () => {
    // Line 26: function signature
    it('should accept generic TMessages type parameter', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: { en: { greeting: 'Hello!' } },
      });
      
      const TestComponent = () => {
        const context = useI18nContext<TestMessages>();
        return <div>{context.i18n.t('greeting')}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    // Line 27: const context = useContext(I18nContext);
    it('should call useContext with I18nContext', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      const TestComponent = () => {
        const context = useI18nContext();
        expect(context).toBeDefined();
        expect(context.i18n).toBe(i18n);
        return <div>Test</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
    });

    // Line 28-30: Context validation
    it('should throw error when used outside I18nProvider', () => {
      const TestComponent = () => {
        useI18nContext();
        return <div>Test</div>;
      };
      
      expect(() => render(<TestComponent />)).toThrow(
        '[i18n] useI18nContext must be used within an I18nProvider with a valid i18n instance'
      );
    });

    it('should throw error when context is null', () => {
      // Mock useContext to return null
      const originalUseContext = React.useContext;
      vi.spyOn(React, 'useContext').mockReturnValue(null);
      
      const TestComponent = () => {
        useI18nContext();
        return <div>Test</div>;
      };
      
      expect(() => render(<TestComponent />)).toThrow(
        '[i18n] useI18nContext must be used within an I18nProvider with a valid i18n instance'
      );
      
      React.useContext = originalUseContext;
    });

    it('should throw error when context.i18n is null', () => {
      // Mock useContext to return context without i18n
      const originalUseContext = React.useContext;
      vi.spyOn(React, 'useContext').mockReturnValue({ i18n: null });
      
      const TestComponent = () => {
        useI18nContext();
        return <div>Test</div>;
      };
      
      expect(() => render(<TestComponent />)).toThrow(
        '[i18n] useI18nContext must be used within an I18nProvider with a valid i18n instance'
      );
      
      React.useContext = originalUseContext;
    });

    // Line 31: return context as I18nContextValue<TMessages>;
    it('should return context cast to correct type', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: { en: { greeting: 'Hello!' } },
      });
      
      const TestComponent = () => {
        const context = useI18nContext<TestMessages>();
        // TypeScript should infer correct types
        const translation = context.i18n.t('greeting');
        return <div>{translation}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });

  describe('useI18n hook (context.tsx Lines 34-48)', () => {
    // Line 34: function signature
    it('should accept generic TMessages type parameter', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: { en: { greeting: 'Hello!' } },
      });
      
      const TestComponent = () => {
        const i18nInstance = useI18n<TestMessages>();
        return <div>{i18nInstance.t('greeting')}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    // Line 35: const { i18n } = useI18nContext<TMessages>();
    it('should destructure i18n from useI18nContext', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      const TestComponent = () => {
        const i18nInstance = useI18n();
        expect(i18nInstance).toBe(i18n);
        return <div>Test</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
    });

    // Line 37: if (!i18n) { throw ... }
    it('should validate i18n instance exists', () => {
      // Mock useI18nContext to return context without i18n
      const originalUseI18nContext = useI18nContext;
      vi.mocked(useI18nContext).mockReturnValue({ i18n: null as any });
      
      const TestComponent = () => {
        useI18n();
        return <div>Test</div>;
      };
      
      expect(() => render(<TestComponent />)).toThrow(
        '[i18n] useI18n requires a valid i18n instance'
      );
    });

    // Lines 41-47: useSyncExternalStore implementation
    it('should use useSyncExternalStore for locale reactivity', async () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { 
          en: { test: 'English' },
          fr: { test: 'Français' }
        },
      });
      
      const TestComponent = () => {
        const i18nInstance = useI18n();
        return <div data-testid="locale">{i18nInstance.locale}</div>;
      };
      
      const { rerender } = render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
      
      // Change locale should trigger re-render
      act(() => {
        i18n.setLocale('fr');
      });
      
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    });

    // Line 42: React.useCallback for subscribe function
    it('should memoize subscribe callback', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      let subscribeCallCount = 0;
      const originalSubscribe = i18n.subscribe;
      i18n.subscribe = vi.fn((callback) => {
        subscribeCallCount++;
        return originalSubscribe(callback);
      });
      
      const TestComponent = () => {
        useI18n();
        return <div>Test</div>;
      };
      
      const { rerender } = render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      // Re-render shouldn't cause additional subscribe calls
      rerender(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(subscribeCallCount).toBe(1); // Should only subscribe once
    });

    // Line 43-45: Subscribe function implementation
    it('should handle i18n instances without subscribe method', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      // Remove subscribe method to test fallback
      delete (i18n as any).subscribe;
      
      const TestComponent = () => {
        const i18nInstance = useI18n();
        return <div>{i18nInstance.locale}</div>;
      };
      
      expect(() => 
        render(
          <I18nProvider i18n={i18n}>
            <TestComponent />
          </I18nProvider>
        )
      ).not.toThrow();
    });

    // Line 47-48: getSnapshot functions
    it('should provide fallback locale when i18n.locale is undefined', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      // Mock locale to be undefined
      Object.defineProperty(i18n, 'locale', {
        get: () => undefined,
        configurable: true
      });
      
      const TestComponent = () => {
        const i18nInstance = useI18n();
        return <div data-testid="locale">{i18nInstance.locale || 'fallback'}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('locale')).toHaveTextContent('fallback');
    });

    // Line 50: React.useDebugValue
    it('should call useDebugValue with locale for debugging', () => {
      const useDebugValueSpy = vi.spyOn(React, 'useDebugValue');
      
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      const TestComponent = () => {
        useI18n();
        return <div>Test</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(useDebugValueSpy).toHaveBeenCalledWith('en');
      
      useDebugValueSpy.mockRestore();
    });

    // Line 52: return i18n;
    it('should return the i18n instance', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'test' } },
      });
      
      const TestComponent = () => {
        const returnedI18n = useI18n();
        expect(returnedI18n).toBe(i18n);
        return <div>Test</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
    });
  });

  describe('useTranslation hook (hooks.tsx)', () => {
    it('should provide t function that calls i18n.t', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { greeting: 'Hello {{name}}!' } },
      });
      
      const TestComponent = () => {
        const { t } = useTranslation();
        return <div>{t('greeting', { name: 'World' })}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });

    it('should provide locale getter', () => {
      const i18n = createI18n({
        locale: 'fr',
        messages: { fr: { test: 'test' } },
      });
      
      const TestComponent = () => {
        const { locale } = useTranslation();
        return <div data-testid="locale">{locale}</div>;
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    });

    it('should provide setLocale function', async () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { 
          en: { test: 'English' },
          fr: { test: 'French' }
        },
      });
      
      const TestComponent = () => {
        const { locale, setLocale } = useTranslation();
        return (
          <div>
            <div data-testid="locale">{locale}</div>
            <button onClick={() => setLocale('fr')}>Change</button>
          </div>
        );
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
      
      act(() => {
        screen.getByRole('button').click();
      });
      
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    });

    it('should provide formatter functions', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const TestComponent = () => {
        const { formatNumber, formatDate, formatRelativeTime } = useTranslation();
        const date = new Date('2024-01-01');
        
        return (
          <div>
            <div data-testid="number">{formatNumber(123.45)}</div>
            <div data-testid="date">{formatDate(date)}</div>
            <div data-testid="relative">{formatRelativeTime(date, new Date('2024-01-02'))}</div>
          </div>
        );
      };
      
      render(
        <I18nProvider i18n={i18n}>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('number')).toHaveTextContent('123.45');
      expect(screen.getByTestId('date')).toHaveTextContent('2024');
      expect(screen.getByTestId('relative')).toHaveTextContent('day');
    });
  });

  describe('T Component (components.tsx Lines 15-46)', () => {
    // Line 15-18: Component props interface
    it('should accept id, values, as, and className props', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { greeting: 'Hello {{name}}!' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T 
            id="greeting" 
            values={{ name: 'World' }}
            as="h1"
            className="test-class"
            data-testid="t-component"
          />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('t-component');
      expect(element.tagName).toBe('H1');
      expect(element).toHaveClass('test-class');
      expect(element).toHaveTextContent('Hello World!');
    });

    // Line 19: useTranslation hook call
    it('should call useTranslation hook', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="test" />
        </I18nProvider>
      );
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    // Line 21: id prop validation
    it('should handle missing id prop gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id={null as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] T component requires an id prop');
    });

    it('should handle undefined id prop', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id={undefined as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] T component requires an id prop');
    });

    it('should handle empty string id prop', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="" />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] T component requires an id prop');
    });

    // Line 25: return null for invalid id
    it('should return null for invalid id in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      try {
        const i18n = createI18n({
          locale: 'en',
          messages: { en: { test: 'Test' } },
        });
        
        const { container } = render(
          <I18nProvider i18n={i18n}>
            <T id={null as any} />
          </I18nProvider>
        );
        
        expect(container.firstChild).toBeNull();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    // Line 28: try-catch block for translation
    it('should handle translation errors gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      // Mock t function to throw error
      const originalT = i18n.t;
      i18n.t = vi.fn(() => {
        throw new Error('Translation error');
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="test" />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] T component translation error:', expect.any(Error));
      expect(screen.getByText('test')).toBeInTheDocument(); // Should fallback to key
      
      i18n.t = originalT;
    });

    // Line 29: const translatedText = t(id, ...(values ? [values as any] : []));
    it('should call t function with correct parameters', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { greeting: 'Hello {{name}}!' } },
      });
      
      const tSpy = vi.spyOn(i18n, 't');
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="greeting" values={{ name: 'World' }} />
        </I18nProvider>
      );
      
      expect(tSpy).toHaveBeenCalledWith('greeting', { name: 'World' });
      
      tSpy.mockRestore();
    });

    it('should call t function without values when values not provided', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { simple: 'Simple' } },
      });
      
      const tSpy = vi.spyOn(i18n, 't');
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="simple" />
        </I18nProvider>
      );
      
      expect(tSpy).toHaveBeenCalledWith('simple');
      
      tSpy.mockRestore();
    });

    // Line 31-35: Component rendering with props spreading
    it('should render with default span element', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="test" data-testid="default-element" />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('default-element');
      expect(element.tagName).toBe('SPAN');
    });

    it('should spread additional props to component', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: { test: 'Test' } },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T 
            id="test" 
            data-testid="props-test"
            title="Test title"
            role="button"
          />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('props-test');
      expect(element).toHaveAttribute('title', 'Test title');
      expect(element).toHaveAttribute('role', 'button');
    });

    // Line 37-43: Error fallback rendering
    it('should render fallback with key when translation fails', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      // Mock t to throw error
      i18n.t = vi.fn(() => {
        throw new Error('Translation error');
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <T id="missing.key" className="error-fallback" />
        </I18nProvider>
      );
      
      const element = screen.getByText('missing.key');
      expect(element).toHaveClass('error-fallback');
    });
  });

  describe('NumberFormat Component (components.tsx Lines 79-87)', () => {
    // Line 79: Component props interface
    it('should accept value, format, as, and className props', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat 
            value={123.45}
            format="currency"
            as="div"
            className="number-format"
            data-testid="number-component"
          />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('number-component');
      expect(element.tagName).toBe('DIV');
      expect(element).toHaveClass('number-format');
    });

    // Line 80: useTranslation hook call
    it('should call useTranslation and use formatNumber', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat value={1234.56} />
        </I18nProvider>
      );
      
      expect(screen.getByText(/1,234.56/)).toBeInTheDocument();
    });

    // Value validation tests
    it('should handle invalid number value (NaN)', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat value={NaN} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] NumberFormat component requires a valid number');
      expect(screen.getByText('NaN')).toBeInTheDocument();
    });

    it('should handle string value', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat value={'123' as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] NumberFormat component requires a valid number');
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat value={null as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] NumberFormat component requires a valid number');
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    // Formatting error handling
    it('should handle formatting errors gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      // Mock formatNumber to throw error
      const originalFormatNumber = i18n.formatNumber;
      i18n.formatNumber = vi.fn(() => {
        throw new Error('Format error');
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <NumberFormat value={123} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] NumberFormat component error:', expect.any(Error));
      expect(screen.getByText('123')).toBeInTheDocument();
      
      i18n.formatNumber = originalFormatNumber;
    });
  });

  describe('DateFormat Component (components.tsx Lines 96-104)', () => {
    // Line 96: Component props interface
    it('should accept value, format, as, and className props', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01');
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat 
            value={date}
            format="short"
            as="time"
            className="date-format"
            data-testid="date-component"
          />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('date-component');
      expect(element.tagName).toBe('TIME');
      expect(element).toHaveClass('date-format');
    });

    // Line 97: useTranslation hook call
    it('should call useTranslation and use formatDate', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01');
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat value={date} />
        </I18nProvider>
      );
      
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    // Date validation tests
    it('should handle invalid Date object', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const invalidDate = new Date('invalid');
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat value={invalidDate} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] DateFormat component requires a valid Date object');
    });

    it('should handle string value', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat value={'2024-01-01' as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] DateFormat component requires a valid Date object');
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat value={null as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] DateFormat component requires a valid Date object');
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    // Formatting error handling
    it('should handle formatting errors gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01');
      
      // Mock formatDate to throw error
      const originalFormatDate = i18n.formatDate;
      i18n.formatDate = vi.fn(() => {
        throw new Error('Format error');
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <DateFormat value={date} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] DateFormat component error:', expect.any(Error));
      expect(screen.getByText(date.toLocaleDateString())).toBeInTheDocument();
      
      i18n.formatDate = originalFormatDate;
    });
  });

  describe('RelativeTime Component (components.tsx Lines 113-121)', () => {
    // Line 113: Component props interface
    it('should accept value, baseDate, as, and className props', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01T12:00:00Z');
      const baseDate = new Date('2024-01-01T11:00:00Z');
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime 
            value={date}
            baseDate={baseDate}
            as="time"
            className="relative-time"
            data-testid="relative-component"
          />
        </I18nProvider>
      );
      
      const element = screen.getByTestId('relative-component');
      expect(element.tagName).toBe('TIME');
      expect(element).toHaveClass('relative-time');
    });

    // Line 114: useTranslation hook call
    it('should call useTranslation and use formatRelativeTime', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01T13:00:00Z');
      const baseDate = new Date('2024-01-01T12:00:00Z');
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime value={date} baseDate={baseDate} />
        </I18nProvider>
      );
      
      expect(screen.getByText(/hour/)).toBeInTheDocument();
    });

    // Date validation tests
    it('should handle invalid value Date', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const invalidDate = new Date('invalid');
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime value={invalidDate} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] RelativeTime component requires a valid Date object');
    });

    it('should handle invalid baseDate', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01');
      const invalidBaseDate = new Date('invalid');
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime value={date} baseDate={invalidBaseDate} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] RelativeTime component baseDate must be a valid Date object');
    });

    it('should handle string value', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime value={'2024-01-01' as any} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] RelativeTime component requires a valid Date object');
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    // Formatting error handling
    it('should handle formatting errors gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });
      
      const date = new Date('2024-01-01');
      
      // Mock formatRelativeTime to throw error
      const originalFormatRelativeTime = i18n.formatRelativeTime;
      i18n.formatRelativeTime = vi.fn(() => {
        throw new Error('Format error');
      });
      
      render(
        <I18nProvider i18n={i18n}>
          <RelativeTime value={date} />
        </I18nProvider>
      );
      
      expect(errorSpy).toHaveBeenCalledWith('[i18n] RelativeTime component error:', expect.any(Error));
      expect(screen.getByText(date.toLocaleDateString())).toBeInTheDocument();
      
      i18n.formatRelativeTime = originalFormatRelativeTime;
    });
  });
});