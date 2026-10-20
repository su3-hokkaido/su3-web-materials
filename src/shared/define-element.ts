/**
 * Registers a custom element unless the tag is already defined or there is no registry (server-side
 * imports). Component entry modules (`index.ts`) call this; the class modules stay free of side
 * effects so the package root can re-export classes without registering anything.
 */
export function defineElement(tag: string, constructor: CustomElementConstructor): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return;
  customElements.define(tag, constructor);
}
