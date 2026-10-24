/** How long typed letters count as one search before the buffer is cleared. */
const RESET_MS = 1000;

/**
 * Type-to-find for a list: it collects the letters the user types (they count as one search for a
 * second) and says which item to move to. Typing the same letter again cycles through the items that
 * start with it.
 */
export class Typeahead {
  #typed = '';
  #timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Returns the index of the item to move to, or -1 when nothing starts with the typed text.
   *
   * @param key The `KeyboardEvent.key` of a printable character.
   * @param labels The lower-cased labels of the items that can be reached.
   * @param current The index of the item that has focus, or -1.
   */
  find(key: string, labels: readonly string[], current: number): number {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#typed = '';
    }, RESET_MS);
    this.#typed += key.toLowerCase();
    const cycling = /^(.)\1*$/u.test(this.#typed);
    const search = cycling ? (this.#typed[0] ?? '') : this.#typed;
    const start = cycling ? current + 1 : Math.max(current, 0);
    for (let step = 0; step < labels.length; step += 1) {
      const index = (start + step) % labels.length;
      if (labels[index]?.startsWith(search)) return index;
    }
    return -1;
  }

  /** Forgets the typed text and stops the reset timer. */
  clear(): void {
    clearTimeout(this.#timer);
    this.#typed = '';
  }

  /** Whether a key is a printable character that should start or extend a search. */
  static isPrintable(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }
}
