import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../feedback/badge/index.ts';
import './index.ts';

interface NavigationBarArgs {
  value: string;
}

const icon = (path: string) =>
  html`<svg
    slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d=${path} />
  </svg>`;

const home = 'M4 11l8-7 8 7v9h-5v-6H9v6H4z';
const inbox = 'M4 5h16v14H4zM4 13h5l1 2h4l1-2h5';
const star = 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z';
const gear = 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3';

const meta: Meta<NavigationBarArgs> = {
  title: 'Navigation/Navigation Bar',
  component: 'su3-navigation-bar',
  args: { value: 'home' },
  argTypes: {
    value: { control: 'inline-radio', options: ['home', 'inbox', 'starred', 'settings'] },
  },
  render: ({ value }) =>
    html`<su3-navigation-bar aria-label="Primary" .value=${value} style="max-width: 420px">
      <su3-navigation-item value="home">${icon(home)}Home</su3-navigation-item>
      <su3-navigation-item value="inbox">${icon(inbox)}Inbox</su3-navigation-item>
      <su3-navigation-item value="starred">${icon(star)}Starred</su3-navigation-item>
      <su3-navigation-item value="settings">${icon(gear)}Settings</su3-navigation-item>
    </su3-navigation-bar>`,
};

export default meta;
type Story = StoryObj<NavigationBarArgs>;

/** Required: clean URLs point at the Default story. Shows the theme effect in every product. */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** A badge in the `badge` slot: a count and a dot. */
export const WithBadges: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-navigation-bar aria-label="Primary" style="max-width: 420px">
      <su3-navigation-item value="home" selected>${icon(home)}Home</su3-navigation-item>
      <su3-navigation-item value="inbox"
        >${icon(inbox)}<su3-badge slot="badge" tone="danger" count="12"></su3-badge
        >Inbox</su3-navigation-item
      >
      <su3-navigation-item value="starred"
        >${icon(star)}<su3-badge slot="badge" tone="danger" dot aria-label="New"></su3-badge
        >Starred</su3-navigation-item
      >
    </su3-navigation-bar>`,
};

/** Items with `href` render links; the item that is not available is skipped. */
export const Links: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-navigation-bar aria-label="Primary" style="max-width: 420px">
      <su3-navigation-item value="home" href="#home" selected
        >${icon(home)}Home</su3-navigation-item
      >
      <su3-navigation-item value="inbox" href="#inbox">${icon(inbox)}Inbox</su3-navigation-item>
      <su3-navigation-item value="settings" href="#settings" disabled
        >${icon(gear)}Settings</su3-navigation-item
      >
    </su3-navigation-bar>`,
};
