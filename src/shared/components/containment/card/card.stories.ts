import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import './index.ts';
import type { CardVariant } from './card.ts';

interface CardArgs {
  variant: CardVariant;
}

const variants: readonly CardVariant[] = ['elevated', 'filled', 'outlined'];

/** Decorative media: a block tinted with a token, standing in for an image. */
const media = html`<div
  slot="media"
  style="height: 96px; background: var(--su3-sys-color-accent-subtle)"
></div>`;

const content = (title: string) => html`
  ${media}
  <span slot="header">${title}</span>
  <span>Short supporting text that describes what this card is about.</span>
  <su3-button slot="actions" variant="text">Dismiss</su3-button>
  <su3-button slot="actions" variant="tonal">Open</su3-button>
`;

const meta: Meta<CardArgs> = {
  title: 'Containment/Card',
  component: 'su3-card',
  argTypes: { variant: { control: 'inline-radio', options: variants } },
  args: { variant: 'elevated' },
  render: ({ variant }) =>
    html`<su3-card variant=${variant} style="width: 280px">${content('Card title')}</su3-card>`,
};

export default meta;
type Story = StoryObj<CardArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

/** Each variant with the same content. Shows the theme effect in every product. */
export const Variants: Story = {
  parameters: { controls: { disable: true }, vrt: { themed: true } },
  render: () =>
    html`<div style="display: flex; flex-wrap: wrap; gap: 16px">
      ${variants.map(
        (variant) =>
          html`<su3-card variant=${variant} style="width: 240px">${content(variant)}</su3-card>`,
      )}
    </div>`,
};

/** Without media the header gets the top padding. */
export const WithoutMedia: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-card style="width: 280px">
      <span slot="header">No media</span>
      <span>Only a header, a body and one action.</span>
      <su3-button slot="actions" variant="text">Open</su3-button>
    </su3-card>`,
};

/** A card with only a body: the empty areas take no space. */
export const BodyOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-card variant="outlined" style="width: 280px">Just some content.</su3-card>`,
};

/** Components are re-themed with `--su3-comp-card-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-card
      style="width: 280px; --su3-comp-card-container-shape: 24px; --su3-comp-card-container-color: #fff4d6; --su3-comp-card-padding: 24px; --su3-comp-card-text-color: #2b2100"
    >
      <span slot="header">Re-themed</span>
      <span>Shape, color and padding come from the component hooks.</span>
    </su3-card>`,
};
