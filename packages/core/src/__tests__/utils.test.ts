import { describe, expect, it } from 'vitest';
import { deepMerge, getNestedValue, getPluralForm, interpolate } from '../utils';

describe('interpolate', () => {
  it('should replace simple placeholders', () => {
    expect(interpolate('Hello {{name}}!', { name: 'John' })).toBe('Hello John!');
  });
  
  it('should handle multiple placeholders', () => {
    expect(
      interpolate('{{greeting}} {{name}}, you have {{count}} messages', {
        greeting: 'Hello',
        name: 'John',
        count: 5,
      })
    ).toBe('Hello John, you have 5 messages');
  });
  
  it('should handle missing parameters', () => {
    expect(interpolate('Hello {{name}}!', {})).toBe('Hello {{name}}!');
  });
  
  it('should handle null and undefined values', () => {
    expect(interpolate('Value: {{value}}', { value: null })).toBe('Value: ');
    expect(interpolate('Value: {{value}}', { value: undefined })).toBe('Value: ');
  });
  
  it('should format dates', () => {
    const date = new Date('2024-01-15');
    const result = interpolate('Date: {{date}}', { date });
    expect(result).toContain('2024');
    expect(result).toContain('15');
    expect(result).toContain('01');
  });
  
  it('should handle typed parameters', () => {
    expect(interpolate('Count: {{count:number}}', { count: 42 })).toBe('Count: 42');
  });
});

describe('deepMerge', () => {
  it('should merge simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    expect(deepMerge(target, source)).toEqual({ a: 1, b: 3, c: 4 });
  });
  
  it('should merge nested objects', () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { c: 3, d: 4 } };
    expect(deepMerge(target, source)).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });
  
  it('should not merge arrays', () => {
    const target = { a: [1, 2] };
    const source = { a: [3, 4] };
    expect(deepMerge(target, source)).toEqual({ a: [3, 4] });
  });
  
  it('should handle null values', () => {
    const target = { a: 1 };
    const source = { a: null };
    expect(deepMerge(target, source)).toEqual({ a: null });
  });
});

describe('getNestedValue', () => {
  it('should get simple values', () => {
    const obj = { a: 1, b: 2 };
    expect(getNestedValue(obj, 'a')).toBe(1);
    expect(getNestedValue(obj, 'b')).toBe(2);
  });
  
  it('should get nested values', () => {
    const obj = { a: { b: { c: 3 } } };
    expect(getNestedValue(obj, 'a.b.c')).toBe(3);
  });
  
  it('should return undefined for non-existent paths', () => {
    const obj = { a: 1 };
    expect(getNestedValue(obj, 'b')).toBeUndefined();
    expect(getNestedValue(obj, 'a.b.c')).toBeUndefined();
  });
});

describe('getPluralForm', () => {
  it('should handle English plurals', () => {
    expect(getPluralForm('en', 0)).toBe('zero');
    expect(getPluralForm('en', 1)).toBe('one');
    expect(getPluralForm('en', 2)).toBe('other');
    expect(getPluralForm('en', 100)).toBe('other');
  });
  
  it('should handle French plurals', () => {
    expect(getPluralForm('fr', 0)).toBe('one');
    expect(getPluralForm('fr', 1)).toBe('one');
    expect(getPluralForm('fr', 2)).toBe('other');
  });
  
  it('should handle languages without plural forms', () => {
    expect(getPluralForm('ja', 0)).toBe('other');
    expect(getPluralForm('ja', 1)).toBe('other');
    expect(getPluralForm('ja', 100)).toBe('other');
  });
  
  it('should fallback to English for unknown locales', () => {
    expect(getPluralForm('unknown', 1)).toBe('one');
    expect(getPluralForm('unknown', 2)).toBe('other');
  });
});