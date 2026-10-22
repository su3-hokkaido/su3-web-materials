import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import '../../feedback/badge/index.ts';
import { Su3NavigationDrawer } from './index.ts';

interface NavigationDrawerArgs {
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

const destinations = html`
  <su3-navigation-item value="home">${icon(home)}Home</su3-navigation-item>
  <su3-navigation-item value="inbox"
    >${icon(inbox)}<su3-badge slot="badge" tone="danger" count="12"></su3-badge
    >Inbox</su3-navigation-item
  >
  <h3>Library</h3>
  <su3-navigation-item value="starred">${icon(star)}Starred</su3-navigation-item>
  <su3-navigation-item value="settings">${icon(gear)}Settings</su3-navigation-item>
`;

const meta: Meta<NavigationDrawerArgs> = {
  title: 'Navigation/Navigation Drawer',
  component: 'su3-navigation-drawer',
  args: { value: 'home' },
  argTypes: {
    value: { control: 'inline-radio', options: ['home', 'inbox', 'starred', 'settings'] },
  },
  render: ({ value }) =>
    html`<div style="block-size: 420px">
      <su3-navigation-drawer aria-label="Primary" .value=${value}>
        <strong slot="header">Mail</strong>
        ${destinations}
      </su3-navigation-drawer>
    </div>`,
};

export default meta;
type Story = StoryObj<NavigationDrawerArgs>;

/** Required: clean URLs point at the Default story. A standard drawer is part of the layout. */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** Without a header and headings: only destinations. */
export const Plain: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="block-size: 420px">
      <su3-navigation-drawer aria-label="Primary">
        <su3-navigation-item value="home" selected>${icon(home)}Home</su3-navigation-item>
        <su3-navigation-item value="inbox">${icon(inbox)}Inbox</su3-navigation-item>
        <su3-navigation-item value="settings" disabled>${icon(gear)}Settings</su3-navigation-item>
      </su3-navigation-drawer>
    </div>`,
};

/**
 * A modal drawer: a panel over the page with a scrim. It closes on Escape, on a click on the scrim
 * and, with `close-on-select`, when a destination is chosen. This story starts open.
 */
export const Modal: Story = {
  parameters: {
    controls: { disable: true },
    docs: { story: { inline: false, iframeHeight: 420 } },
  },
  render: () =>
    html`<su3-navigation-drawer aria-label="Primary" modal open close-on-select>
      <strong slot="header">Mail</strong>
      ${destinations}
    </su3-navigation-drawer>`,
};

/** Closed by default; the button opens it, and focus returns to the button when it closes. */
export const ModalWithOpener: Story = {
  parameters: {
    controls: { disable: true },
    vrt: { disable: true },
    docs: { story: { inline: false, iframeHeight: 420 } },
  },
  render: () =>
    html`<su3-button
        @click=${(event: Event) => {
          const root =
            event.currentTarget instanceof Element ? event.currentTarget.parentElement : null;
          const drawer = root?.querySelector('su3-navigation-drawer');
          if (drawer instanceof Su3NavigationDrawer) drawer.open = true;
        }}
        >Open menu</su3-button
      >
      <su3-navigation-drawer aria-label="Primary" modal close-on-select>
        <strong slot="header">Mail</strong>
        ${destinations}
      </su3-navigation-drawer>`,
};
