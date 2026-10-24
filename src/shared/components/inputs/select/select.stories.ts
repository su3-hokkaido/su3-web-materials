import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import './index.ts';
import type { SelectVariant } from './select.ts';

interface SelectArgs {
  variant: SelectVariant;
  label: string;
  placeholder: string;
  supportingText: string;
  errorText: string;
  required: boolean;
  disabled: boolean;
  open: boolean;
  value: string;
}

const fruit = (selected = '') => html`
  <su3-option value="apple" ?selected=${selected === 'apple'}>Apple</su3-option>
  <su3-option value="banana" ?selected=${selected === 'banana'}>Banana</su3-option>
  <su3-option value="cherry" disabled>Cherry (sold out)</su3-option>
  <su3-option value="grape" ?selected=${selected === 'grape'}>Grape</su3-option>
`;

const meta: Meta<SelectArgs> = {
  title: 'Inputs/Select',
  component: 'su3-select',
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    value: { control: 'inline-radio', options: ['', 'apple', 'banana', 'grape'] },
  },
  args: {
    variant: 'outlined',
    label: 'Fruit',
    placeholder: 'Choose a fruit',
    supportingText: '',
    errorText: '',
    required: false,
    disabled: false,
    open: false,
    value: '',
  },
  parameters: { docs: { story: { inline: false, iframeHeight: 320 } } },
  render: ({
    variant,
    label,
    placeholder,
    supportingText,
    errorText,
    required,
    disabled,
    open,
    value,
  }) =>
    html`<div style="max-width: 280px; padding-block-end: 12rem">
      <su3-select
        variant=${variant}
        label=${label}
        placeholder=${placeholder}
        supporting-text=${supportingText}
        error-text=${errorText}
        ?required=${required}
        ?disabled=${disabled}
        ?open=${open}
        .value=${value}
      >
        ${fruit()}
      </su3-select>
    </div>`,
};

export default meta;
type Story = StoryObj<SelectArgs>;

/**
 * Required: clean URLs point at the Default story. It starts open so the catalog and the
 * screenshots show the list; in an app the button opens it.
 */
export const Default: Story = {
  args: { open: true, value: 'banana' },
  parameters: { vrt: { themed: true } },
};

/** Closed, with the placeholder. */
export const Closed: Story = {};

export const Filled: Story = { args: { variant: 'filled', value: 'apple' } };

export const WithSupportingText: Story = {
  args: { supportingText: 'Pick the one you like best' },
};

export const WithError: Story = {
  args: { errorText: 'Choose a fruit to continue', required: true },
};

export const Disabled: Story = { args: { disabled: true, value: 'grape' } };

/** A required select in a form: leaving it empty and submitting shows the validation message. */
export const InForm: Story = {
  parameters: { controls: { disable: true }, vrt: { disable: true } },
  render: () =>
    html`<form
      style="max-width: 280px; display: grid; gap: 16px"
      @submit=${(event: Event) => {
        event.preventDefault();
      }}
    >
      <su3-select name="fruit" label="Fruit" required placeholder="Choose a fruit">
        ${fruit()}
      </su3-select>
      <su3-button type="submit">Submit</su3-button>
    </form>`,
};
