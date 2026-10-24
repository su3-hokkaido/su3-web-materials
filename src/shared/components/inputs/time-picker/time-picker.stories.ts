import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';
import type { TimePickerHourCycle, TimePickerVariant } from './time-picker.ts';

interface TimePickerArgs {
  variant: TimePickerVariant;
  label: string;
  placeholder: string;
  supportingText: string;
  errorText: string;
  value: string;
  min: string;
  max: string;
  step: number;
  hourCycle: TimePickerHourCycle;
  required: boolean;
  disabled: boolean;
  open: boolean;
}

const meta: Meta<TimePickerArgs> = {
  title: 'Inputs/Time Picker',
  component: 'su3-time-picker',
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    value: { control: 'text', description: 'A 24-hour time, for example 14:30.' },
    hourCycle: { control: 'inline-radio', options: ['', '12', '24'] },
    step: { control: 'select', options: [1, 5, 10, 15, 30] },
  },
  args: {
    variant: 'outlined',
    label: 'Start time',
    placeholder: 'Choose a time',
    supportingText: '',
    errorText: '',
    value: '14:30',
    min: '',
    max: '',
    step: 15,
    hourCycle: '12',
    required: false,
    disabled: false,
    open: false,
  },
  parameters: { docs: { story: { inline: false, iframeHeight: 380 } } },
  render: ({
    variant,
    label,
    placeholder,
    supportingText,
    errorText,
    value,
    min,
    max,
    step,
    hourCycle,
    required,
    disabled,
    open,
  }) =>
    html`<div style="max-width: 280px; padding-block-end: 20rem">
      <su3-time-picker
        locale="en-US"
        variant=${variant}
        label=${label}
        placeholder=${placeholder}
        supporting-text=${supportingText}
        error-text=${errorText}
        min=${min}
        max=${max}
        step=${step}
        hour-cycle=${hourCycle}
        .value=${value}
        ?required=${required}
        ?disabled=${disabled}
        ?open=${open}
      ></su3-time-picker>
    </div>`,
};

export default meta;
type Story = StoryObj<TimePickerArgs>;

/**
 * Required: clean URLs point at the Default story. It starts open so the catalog and the
 * screenshots show the lists; in an app the button opens it.
 */
export const Default: Story = { args: { open: true }, parameters: { vrt: { themed: true } } };

/** Closed, with the chosen time. */
export const Closed: Story = {};

export const TwentyFourHour: Story = { args: { open: true, hourCycle: '24', step: 5 } };

export const Empty: Story = { args: { value: '' } };

export const Filled: Story = { args: { variant: 'filled' } };

export const WithError: Story = {
  args: { value: '', required: true, errorText: 'Choose a time to continue' },
};

export const Disabled: Story = { args: { disabled: true } };

/** Options that would give a time outside `min` and `max` are shown but cannot be chosen. */
export const WithRange: Story = {
  args: { open: true, min: '09:00', max: '17:30', value: '12:00' },
};

/** The lists on their own. */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-time-picker
      inline
      locale="en-US"
      hour-cycle="24"
      step="15"
      label="Choose a time"
      value="14:30"
    ></su3-time-picker>`,
};
