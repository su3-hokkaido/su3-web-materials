import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';

interface NavigationItemArgs {
  label: string;
  selected: boolean;
  disabled: boolean;
  href: string;
}

const homeIcon = html`<svg
  slot="icon"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
</svg>`;

const meta: Meta<NavigationItemArgs> = {
  title: 'Navigation/Navigation Item',
  component: 'su3-navigation-item',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { label: 'Home', selected: false, disabled: false, href: '' },
  render: ({ label, selected, disabled, href }) =>
    html`<div style="width: 96px">
      <su3-navigation-item value="home" href=${href} ?selected=${selected} ?disabled=${disabled}
        >${homeIcon}${label}</su3-navigation-item
      >
    </div>`,
};

export default meta;
type Story = StoryObj<NavigationItemArgs>;

/**
 * Required: clean URLs point at the Default story. An item belongs inside a `su3-navigation-bar`,
 * which owns selection; shown alone it is only a styled button.
 */
export const Default: Story = {};

export const Selected: Story = { args: { selected: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Link: Story = { args: { href: '#home' } };
