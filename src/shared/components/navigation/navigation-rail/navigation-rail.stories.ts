import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/icon-button/index.ts';
import '../../feedback/badge/index.ts';
import './index.ts';

interface NavigationRailArgs {
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
const menu = 'M4 6h16M4 12h16M4 18h16';

const meta: Meta<NavigationRailArgs> = {
  title: 'Navigation/Navigation Rail',
  component: 'su3-navigation-rail',
  args: { value: 'home' },
  argTypes: {
    value: { control: 'inline-radio', options: ['home', 'inbox', 'starred', 'settings'] },
  },
  render: ({ value }) =>
    html`<div style="block-size: 420px">
      <su3-navigation-rail aria-label="Primary" .value=${value}>
        <su3-navigation-item value="home">${icon(home)}Home</su3-navigation-item>
        <su3-navigation-item value="inbox">${icon(inbox)}Inbox</su3-navigation-item>
        <su3-navigation-item value="starred">${icon(star)}Starred</su3-navigation-item>
        <su3-navigation-item value="settings">${icon(gear)}Settings</su3-navigation-item>
      </su3-navigation-rail>
    </div>`,
};

export default meta;
type Story = StoryObj<NavigationRailArgs>;

/** Required: clean URLs point at the Default story. Shows the theme effect in every product. */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** A menu button in the `header` slot. */
export const WithHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="block-size: 420px">
      <su3-navigation-rail aria-label="Primary">
        <su3-icon-button slot="header" aria-label="Menu">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d=${menu} />
          </svg>
        </su3-icon-button>
        <su3-navigation-item value="home" selected>${icon(home)}Home</su3-navigation-item>
        <su3-navigation-item value="inbox">${icon(inbox)}Inbox</su3-navigation-item>
        <su3-navigation-item value="settings">${icon(gear)}Settings</su3-navigation-item>
      </su3-navigation-rail>
    </div>`,
};

/** A badge in the `badge` slot of an item, and a disabled item. */
export const WithBadges: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="block-size: 420px">
      <su3-navigation-rail aria-label="Primary">
        <su3-navigation-item value="home" selected>${icon(home)}Home</su3-navigation-item>
        <su3-navigation-item value="inbox"
          >${icon(inbox)}<su3-badge slot="badge" tone="danger" count="12"></su3-badge
          >Inbox</su3-navigation-item
        >
        <su3-navigation-item value="starred"
          >${icon(star)}<su3-badge slot="badge" tone="danger" dot aria-label="New"></su3-badge
          >Starred</su3-navigation-item
        >
        <su3-navigation-item value="settings" disabled>${icon(gear)}Settings</su3-navigation-item>
      </su3-navigation-rail>
    </div>`,
};
