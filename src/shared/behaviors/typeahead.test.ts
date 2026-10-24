import { afterEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from './typeahead.ts';

const labels = ['apple', 'banana', 'blueberry', 'cherry', 'avocado'];

afterEach(() => {
  vi.useRealTimers();
});

describe('Typeahead', () => {
  it('finds the first label that starts with the typed letter, from the current item on', () => {
    const typeahead = new Typeahead();
    expect(typeahead.find('b', labels, -1)).toBe(1);
    typeahead.clear();
    expect(typeahead.find('c', labels, 1)).toBe(3);
  });

  it('extends the search while letters are typed in quick succession', () => {
    const typeahead = new Typeahead();
    expect(typeahead.find('b', labels, -1)).toBe(1);
    expect(typeahead.find('l', labels, 1)).toBe(2);
  });

  it('cycles through the labels that start with a repeated letter, and wraps', () => {
    const typeahead = new Typeahead();
    expect(typeahead.find('b', labels, -1)).toBe(1);
    expect(typeahead.find('b', labels, 1)).toBe(2);
    expect(typeahead.find('b', labels, 2)).toBe(1);
  });

  it('wraps around the end of the list', () => {
    const typeahead = new Typeahead();
    expect(typeahead.find('a', labels, 4)).toBe(0);
  });

  it('returns -1 when nothing starts with the text, and for an empty list', () => {
    const typeahead = new Typeahead();
    expect(typeahead.find('z', labels, -1)).toBe(-1);
    typeahead.clear();
    expect(typeahead.find('a', [], -1)).toBe(-1);
  });

  it('forgets the typed text after a second', () => {
    vi.useFakeTimers();
    const typeahead = new Typeahead();
    expect(typeahead.find('b', labels, -1)).toBe(1);
    vi.advanceTimersByTime(1100);
    // The buffer was reset: "l" alone matches nothing, instead of continuing "bl".
    expect(typeahead.find('l', labels, 1)).toBe(-1);
  });

  it('recognises printable keys only', () => {
    const key = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent('keydown', init);
    expect(Typeahead.isPrintable(key({ key: 'a' }))).toBe(true);
    expect(Typeahead.isPrintable(key({ key: 'Enter' }))).toBe(false);
    expect(Typeahead.isPrintable(key({ key: 'a', ctrlKey: true }))).toBe(false);
    expect(Typeahead.isPrintable(key({ key: 'a', metaKey: true }))).toBe(false);
  });
});
