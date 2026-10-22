import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/icon-button/index.ts';
import './index.ts';
import type { TopAppBarVariant } from './top-app-bar.ts';

interface TopAppBarArgs {
  title: string;
  variant: TopAppBarVariant;
  scrolled: boolean;
  sticky: boolean;
  elevateOnScroll: boolean;
}

const icon = (path: string) =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d=${path} />
  </svg>`;

const menu = 'M4 6h16M4 12h16M4 18h16';
const search = 'M11 4a7 7 0 100 14 7 7 0 000-14zM16 16l5 5';
const more = 'M12 5h.01M12 12h.01M12 19h.01';

const meta: Meta<TopAppBarArgs> = {
  title: 'Navigation/Top App Bar',
  component: 'su3-top-app-bar',
  argTypes: {
    title: { control: 'text', description: 'Content of the default slot (story only).' },
    variant: { control: 'inline-radio', options: ['small', 'center', 'large'] },
  },
  args: {
    title: 'Inbox',
    variant: 'small',
    scrolled: false,
    sticky: false,
    elevateOnScroll: false,
  },
  render: ({ title, variant, scrolled, sticky, elevateOnScroll }) =>
    html`<su3-top-app-bar
      variant=${variant}
      ?scrolled=${scrolled}
      ?sticky=${sticky}
      ?elevate-on-scroll=${elevateOnScroll}
    >
      <su3-icon-button slot="navigation" aria-label="Menu">${icon(menu)}</su3-icon-button>
      <h1>${title}</h1>
      <su3-icon-button slot="actions" aria-label="Search">${icon(search)}</su3-icon-button>
      <su3-icon-button slot="actions" aria-label="More">${icon(more)}</su3-icon-button>
    </su3-top-app-bar>`,
};

export default meta;
type Story = StoryObj<TopAppBarArgs>;

/** Required: clean URLs point at the Default story. Shows the theme effect in every product. */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** The title is centered. */
export const Center: Story = { args: { variant: 'center' } };

/** Two rows: the controls, then a larger title. */
export const Large: Story = { args: { variant: 'large', title: 'Inbox and everything else' } };

/** The raised state that `elevate-on-scroll` shows while the page is scrolled. */
export const Scrolled: Story = { args: { scrolled: true } };

/** Only a title, no controls. */
export const TitleOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<su3-top-app-bar><h1>Settings</h1></su3-top-app-bar>`,
};
