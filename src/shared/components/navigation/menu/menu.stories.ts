import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import '../../buttons/icon-button/index.ts';
import '../../containment/divider/index.ts';
import './index.ts';
import type { MenuPlacement } from './menu.ts';

interface MenuArgs {
  open: boolean;
  placement: MenuPlacement;
}

const icon = (path: string) =>
  html`<svg
    slot="leading"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d=${path} />
  </svg>`;

const edit = 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4';
const copy = 'M9 9h10v10H9zM5 15V5h10';
const trash = 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13';

const meta: Meta<MenuArgs> = {
  title: 'Navigation/Menu',
  component: 'su3-menu',
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
    },
  },
  args: { open: true, placement: 'bottom-start' },
  parameters: { docs: { story: { inline: false, iframeHeight: 320 } } },
  render: ({ open, placement }) =>
    html`<div style="padding: 2rem 6rem">
      <su3-menu ?open=${open} placement=${placement} aria-label="Actions">
        <su3-button slot="trigger" variant="tonal">Actions</su3-button>
        <su3-menu-item value="edit">${icon(edit)}Edit</su3-menu-item>
        <su3-menu-item value="copy">${icon(copy)}Duplicate</su3-menu-item>
        <su3-divider></su3-divider>
        <su3-menu-item value="delete">${icon(trash)}Delete</su3-menu-item>
      </su3-menu>
    </div>`,
};

export default meta;
type Story = StoryObj<MenuArgs>;

/**
 * Required: clean URLs point at the Default story. It starts open so the catalog and the
 * screenshots show it; in an app the trigger opens it.
 */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** Checkable items toggle when activated; a disabled item is skipped by the keyboard. */
export const Checkable: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="padding: 2rem 6rem">
      <su3-menu open aria-label="View">
        <su3-button slot="trigger" variant="outlined">View</su3-button>
        <su3-menu-item checkable checked value="grid">Show grid</su3-menu-item>
        <su3-menu-item checkable value="rulers">Show rulers</su3-menu-item>
        <su3-menu-item checkable disabled value="guides">Show guides</su3-menu-item>
        <su3-menu-item value="reset">Reset view<span slot="trailing">Ctrl+0</span></su3-menu-item>
      </su3-menu>
    </div>`,
};

/** An icon button as the trigger, aligned to the end. */
export const IconTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="padding: 2rem 12rem; display: flex; justify-content: flex-end">
      <su3-menu open placement="bottom-end" aria-label="More">
        <su3-icon-button slot="trigger" aria-label="More options">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5h.01M12 12h.01M12 19h.01" />
          </svg>
        </su3-icon-button>
        <su3-menu-item value="share">Share</su3-menu-item>
        <su3-menu-item value="rename">Rename</su3-menu-item>
      </su3-menu>
    </div>`,
};

/** Closed by default: click the button, or focus it and press ArrowDown. */
export const Interactive: Story = {
  args: { open: false },
  parameters: { controls: { disable: true }, vrt: { disable: true } },
};
