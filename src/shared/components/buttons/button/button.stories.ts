import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import type { FormSubmitterType } from '../../../behaviors/index.ts';
import type { ButtonSize, ButtonVariant } from './button.ts';
import './index.ts';

interface ButtonArgs {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  softDisabled: boolean;
  href: string;
  type: FormSubmitterType;
}

const variants: readonly ButtonVariant[] = ['filled', 'tonal', 'elevated', 'outlined', 'text'];
const sizes: readonly ButtonSize[] = ['sm', 'md', 'lg'];

/** Decorative icons used by the stories; `fill` follows the label color. */
const plusIcon = (slot: 'leading' | 'trailing') =>
  html`<svg slot=${slot} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
  </svg>`;

const row = (content: unknown) =>
  html`<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
    ${content}
  </div>`;

const meta: Meta<ButtonArgs> = {
  title: 'Buttons/Button',
  component: 'su3-button',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: sizes },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    href: { control: 'text' },
  },
  args: {
    label: 'Button',
    variant: 'filled',
    size: 'md',
    disabled: false,
    softDisabled: false,
    href: '',
    type: 'submit',
  },
  render: ({ label, variant, size, disabled, softDisabled, href, type }) =>
    html`<su3-button
      variant=${variant}
      size=${size}
      type=${type}
      href=${href || nothing}
      ?disabled=${disabled}
      ?soft-disabled=${softDisabled}
      >${label}</su3-button
    >`,
};

export default meta;
type Story = StoryObj<ButtonArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

/** Emphasis, from the most to the least prominent. */
export const Variants: Story = {
  // Also captured in every product's build, so each theme's look is guarded (tests/vrt/stories.ts).
  parameters: { controls: { disable: true }, vrt: { themed: true } },
  render: () =>
    row(variants.map((variant) => html`<su3-button variant=${variant}>${variant}</su3-button>`)),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => row(sizes.map((size) => html`<su3-button size=${size}>Size ${size}</su3-button>`)),
};

/** Icons go in the `leading` and `trailing` slots. An icon-only button needs an `aria-label`. */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(html`
      <su3-button>${plusIcon('leading')}Add item</su3-button>
      <su3-button variant="outlined">Next ${plusIcon('trailing')}</su3-button>
      <su3-button variant="tonal" aria-label="Add item">${plusIcon('leading')}</su3-button>
    `),
};

/** `disabled` removes the button from the tab order and ignores input. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(
      variants.map(
        (variant) => html`<su3-button variant=${variant} disabled>${variant}</su3-button>`,
      ),
    ),
};

/**
 * `soft-disabled` looks disabled but stays focusable, so people using a keyboard or a screen reader
 * can still find the button and learn why it is unavailable.
 */
export const SoftDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(
      variants.map(
        (variant) => html`<su3-button variant=${variant} soft-disabled>${variant}</su3-button>`,
      ),
    ),
};

/** With `href` the button renders an anchor. */
export const AsLink: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(html`
      <su3-button href="https://example.com" target="_blank" rel="noreferrer">
        Open example.com ${plusIcon('trailing')}
      </su3-button>
      <su3-button variant="outlined" href="https://example.com" disabled
        >Unavailable link</su3-button
      >
    `),
};

/** A submit button submits its form; a reset button resets it. Values appear only when clicked. */
export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display: flex; flex-direction: column; gap: 12px"
      @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const output = form.querySelector('output');
        if (output) output.textContent = JSON.stringify(Object.fromEntries(new FormData(form)));
      }}
    >
      <label>
        Name
        <input name="name" required />
      </label>
      ${row(html`
        <su3-button type="submit" name="intent" value="save">Save</su3-button>
        <su3-button type="reset" variant="outlined">Reset</su3-button>
      `)}
      <output aria-live="polite"></output>
    </form>
  `,
};

/** Components are re-themed with `--su3-comp-button-*`; whole themes override `--su3-sys-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(html`
      <su3-button style="--su3-comp-button-container-shape: 9999px">Pill shape</su3-button>
      <su3-button
        variant="outlined"
        style="--su3-comp-button-height: 3.5rem; --su3-comp-button-padding-inline: 2rem"
      >
        Taller
      </su3-button>
      <div
        style="--su3-sys-color-accent: #8a3ffc; --su3-sys-color-accent-hover: #6929c4; --su3-sys-color-accent-active: #491d8b; --su3-sys-color-on-accent: #ffffff"
      >
        <su3-button>Custom accent</su3-button>
      </div>
    `),
};
