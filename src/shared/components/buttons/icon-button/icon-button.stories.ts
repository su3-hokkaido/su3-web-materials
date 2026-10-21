import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';
import type { IconButtonSize, IconButtonVariant } from './icon-button.ts';

interface IconButtonArgs {
  variant: IconButtonVariant;
  size: IconButtonSize;
  toggle: boolean;
  selected: boolean;
  disabled: boolean;
}

const variants: readonly IconButtonVariant[] = ['standard', 'filled', 'tonal', 'outlined'];
const sizes: readonly IconButtonSize[] = ['sm', 'md', 'lg'];

const starIcon = (slot?: string) =>
  html`<svg
    slot=${slot ?? ''}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>`;

const starFilled = (slot: string) =>
  html`<svg slot=${slot} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>`;

const row = (content: unknown) =>
  html`<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
    ${content}
  </div>`;

const meta: Meta<IconButtonArgs> = {
  title: 'Buttons/Icon Button',
  component: 'su3-icon-button',
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: sizes },
  },
  args: { variant: 'standard', size: 'md', toggle: false, selected: false, disabled: false },
  render: ({ variant, size, toggle, selected, disabled }) =>
    html`<su3-icon-button
      aria-label="Favorite"
      variant=${variant}
      size=${size}
      ?toggle=${toggle}
      ?selected=${selected}
      ?disabled=${disabled}
      >${starIcon()}</su3-icon-button
    >`,
};

export default meta;
type Story = StoryObj<IconButtonArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

export const Variants: Story = {
  // Also captured in every product's build, so each theme's look is guarded (tests/vrt/stories.ts).
  parameters: { controls: { disable: true }, vrt: { themed: true } },
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<su3-icon-button aria-label=${variant} variant=${variant}
            >${starIcon()}</su3-icon-button
          >`,
      ),
    ),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(
      sizes.map(
        (size) =>
          html`<su3-icon-button aria-label=${`Size ${size}`} variant="tonal" size=${size}
            >${starIcon()}</su3-icon-button
          >`,
      ),
    ),
};

/** A toggle button announces `aria-pressed`; the optional `selected` slot swaps the icon. */
export const Toggle: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(
      variants.map(
        (variant) => html`
          <su3-icon-button aria-label=${`${variant} off`} variant=${variant} toggle>
            ${starIcon()}${starFilled('selected')}
          </su3-icon-button>
          <su3-icon-button aria-label=${`${variant} on`} variant=${variant} toggle selected>
            ${starIcon()}${starFilled('selected')}
          </su3-icon-button>
        `,
      ),
    ),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(
      variants.map(
        (variant) =>
          html`<su3-icon-button aria-label=${variant} variant=${variant} disabled
            >${starIcon()}</su3-icon-button
          >`,
      ),
    ),
};

/** Components are re-themed with `--su3-comp-icon-button-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    row(html`
      <su3-icon-button
        aria-label="Round"
        variant="filled"
        style="--su3-comp-icon-button-container-shape: 9999px"
        >${starIcon()}</su3-icon-button
      >
      <su3-icon-button
        aria-label="Large"
        variant="outlined"
        style="--su3-comp-icon-button-size: 4rem; --su3-comp-icon-button-icon-size: 2rem"
        >${starIcon()}</su3-icon-button
      >
    `),
};
