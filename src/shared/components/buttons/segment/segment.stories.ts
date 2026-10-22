import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';

interface SegmentArgs {
  label: string;
  selected: boolean;
  disabled: boolean;
}

const meta: Meta<SegmentArgs> = {
  title: 'Buttons/Segment',
  component: 'su3-segment',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { label: 'Day', selected: false, disabled: false },
  render: ({ label, selected, disabled }) =>
    html`<su3-segment value="day" ?selected=${selected} ?disabled=${disabled}
      >${label}</su3-segment
    >`,
};

export default meta;
type Story = StoryObj<SegmentArgs>;

/**
 * Required: clean URLs point at the Default story. A segment belongs inside a
 * `su3-segmented-button`, which owns selection and keyboard navigation; shown alone it is only a
 * styled button.
 */
export const Default: Story = {};

export const Selected: Story = { args: { selected: true } };

export const Disabled: Story = { args: { disabled: true } };
