import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';

interface MenuItemArgs {
  label: string;
  disabled: boolean;
  checkable: boolean;
  checked: boolean;
}

const meta: Meta<MenuItemArgs> = {
  title: 'Navigation/Menu Item',
  component: 'su3-menu-item',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { label: 'Duplicate', disabled: false, checkable: false, checked: false },
  render: ({ label, disabled, checkable, checked }) =>
    html`<div style="width: 220px; background: var(--su3-sys-color-surface-raised)">
      <su3-menu-item ?disabled=${disabled} ?checkable=${checkable} ?checked=${checked}
        >${label}<span slot="trailing">Ctrl+D</span></su3-menu-item
      >
    </div>`,
};

export default meta;
type Story = StoryObj<MenuItemArgs>;

/**
 * Required: clean URLs point at the Default story. An item belongs inside a `su3-menu`, which
 * handles activation; shown alone it is only a styled row.
 */
export const Default: Story = {};

export const Checked: Story = { args: { checkable: true, checked: true } };

export const Disabled: Story = { args: { disabled: true } };
