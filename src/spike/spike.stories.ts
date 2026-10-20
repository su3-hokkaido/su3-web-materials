import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './spike-element.ts';

const meta = {
  title: 'Spike/Spike',
  component: 'su3-spike',
  argTypes: {
    variant: { control: 'select', options: ['a', 'b'] },
    disabled: { control: 'boolean' },
  },
  args: { variant: 'a', disabled: false },
  render: ({ variant, disabled }) =>
    html`<su3-spike variant=${variant} ?disabled=${disabled}>Go</su3-spike>`,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};
