import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';

interface OptionArgs {
  label: string;
  selected: boolean;
  disabled: boolean;
}

const meta: Meta<OptionArgs> = {
  title: 'Inputs/Option',
  component: 'su3-option',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { label: 'Banana', selected: false, disabled: false },
  render: ({ label, selected, disabled }) =>
    html`<div style="width: 220px; background: var(--su3-sys-color-surface-raised)">
      <su3-option ?selected=${selected} ?disabled=${disabled}>${label}</su3-option>
    </div>`,
};

export default meta;
type Story = StoryObj<OptionArgs>;

/**
 * Required: clean URLs point at the Default story. An option belongs inside a `su3-select`, which
 * handles choosing; shown alone it is only a styled row.
 */
export const Default: Story = {};

export const Selected: Story = { args: { selected: true } };

export const Disabled: Story = { args: { disabled: true } };
