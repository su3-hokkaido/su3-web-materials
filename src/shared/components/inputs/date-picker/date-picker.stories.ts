import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';
import type { DatePickerVariant } from './date-picker.ts';

interface DatePickerArgs {
  variant: DatePickerVariant;
  label: string;
  placeholder: string;
  supportingText: string;
  errorText: string;
  value: string;
  min: string;
  max: string;
  required: boolean;
  disabled: boolean;
  open: boolean;
}

const meta: Meta<DatePickerArgs> = {
  title: 'Inputs/Date Picker',
  component: 'su3-date-picker',
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    value: { control: 'text', description: 'An ISO date, for example 2024-03-15.' },
    min: { control: 'text' },
    max: { control: 'text' },
  },
  args: {
    variant: 'outlined',
    label: 'Date of birth',
    placeholder: 'Choose a date',
    supportingText: '',
    errorText: '',
    value: '2024-03-15',
    min: '',
    max: '',
    required: false,
    disabled: false,
    open: false,
  },
  parameters: { docs: { story: { inline: false, iframeHeight: 460 } } },
  render: ({
    variant,
    label,
    placeholder,
    supportingText,
    errorText,
    value,
    min,
    max,
    required,
    disabled,
    open,
  }) =>
    html`<div style="max-width: 280px; padding-block-end: 26rem">
      <su3-date-picker
        locale="en-US"
        variant=${variant}
        label=${label}
        placeholder=${placeholder}
        supporting-text=${supportingText}
        error-text=${errorText}
        min=${min}
        max=${max}
        .value=${value}
        ?required=${required}
        ?disabled=${disabled}
        ?open=${open}
      ></su3-date-picker>
    </div>`,
};

export default meta;
type Story = StoryObj<DatePickerArgs>;

/**
 * Required: clean URLs point at the Default story. It starts open so the catalog and the
 * screenshots show the calendar; in an app the button opens it. The date is fixed so the
 * screenshots do not depend on today.
 */
export const Default: Story = { args: { open: true }, parameters: { vrt: { themed: true } } };

/** Closed, with the chosen date. */
export const Closed: Story = {};

export const Empty: Story = { args: { value: '' } };

export const Filled: Story = { args: { variant: 'filled' } };

export const WithError: Story = {
  args: { value: '', required: true, errorText: 'Choose a date to continue' },
};

export const Disabled: Story = { args: { disabled: true } };

/** Days outside `min` and `max` are shown but cannot be chosen. */
export const WithRange: Story = {
  args: { open: true, min: '2024-03-10', max: '2024-03-20' },
};

/** The calendar on its own, with the week starting on Sunday. */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-date-picker
      inline
      locale="en-US"
      label="Choose a date"
      value="2024-03-15"
    ></su3-date-picker>`,
};

/** A different language and first day of the week. */
export const German: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-date-picker
      inline
      locale="de-DE"
      label="Datum"
      value="2024-03-15"
      previous-label="Vorheriger Monat"
      next-label="Naechster Monat"
    ></su3-date-picker>`,
};
