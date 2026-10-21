import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import '../../buttons/button/index.ts'; // used by the InForm story
import './index.ts';
import type { TextFieldType, TextFieldVariant } from './text-field.ts';

interface TextFieldArgs {
  label: string;
  variant: TextFieldVariant;
  type: TextFieldType;
  value: string;
  placeholder: string;
  supportingText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
}

const column = (content: unknown) =>
  html`<div style="display: flex; flex-direction: column; gap: 16px; width: 320px">
    ${content}
  </div>`;

const searchIcon = (slot: 'leading' | 'trailing') =>
  html`<svg
    slot=${slot}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="6" />
    <path d="M16 16l5 5" stroke-linecap="round" />
  </svg>`;

const meta: Meta<TextFieldArgs> = {
  title: 'Inputs/Text Field',
  component: 'su3-text-field',
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url'] },
  },
  args: {
    label: 'Name',
    variant: 'outlined',
    type: 'text',
    value: '',
    placeholder: '',
    supportingText: 'As shown on your card',
    errorText: '',
    disabled: false,
    readonly: false,
    required: false,
  },
  render: (args) =>
    html`<div style="width: 320px">
      <su3-text-field
        variant=${args.variant}
        type=${args.type}
        label=${args.label}
        value=${args.value}
        placeholder=${args.placeholder || nothing}
        supporting-text=${args.supportingText || nothing}
        error-text=${args.errorText || nothing}
        ?disabled=${args.disabled}
        ?readonly=${args.readonly}
        ?required=${args.required}
      ></su3-text-field>
    </div>`,
};

export default meta;
type Story = StoryObj<TextFieldArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-text-field
        label="Outlined"
        value="Ada Lovelace"
        supporting-text="Outlined variant"
      ></su3-text-field>
      <su3-text-field
        variant="filled"
        label="Filled"
        value="Ada Lovelace"
        supporting-text="Filled variant"
      ></su3-text-field>
    `),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-text-field label="Placeholder" placeholder="Type here"></su3-text-field>
      <su3-text-field label="Required" required supporting-text="Required"></su3-text-field>
      <su3-text-field label="Error" value="abc" error-text="Enter a valid code"></su3-text-field>
      <su3-text-field label="Disabled" value="Locked" disabled></su3-text-field>
      <su3-text-field label="Read only" value="Read only value" readonly></su3-text-field>
      <su3-text-field
        variant="filled"
        label="Filled error"
        value="abc"
        error-text="Enter a valid code"
      ></su3-text-field>
      <su3-text-field
        variant="filled"
        label="Filled disabled"
        value="Locked"
        disabled
      ></su3-text-field>
    `),
};

export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-text-field label="Search" type="search" placeholder="Search the catalog">
        ${searchIcon('leading')}
      </su3-text-field>
      <su3-text-field variant="filled" label="Filter" placeholder="Filter by name">
        ${searchIcon('trailing')}
      </su3-text-field>
    `),
};

/** Without a visible label the field needs an `aria-label`. */
export const WithoutLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`<su3-text-field aria-label="Search" placeholder="Search"></su3-text-field>`),
};

/** Native validation: the browser's messages appear after the user leaves the field. */
export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display: flex; flex-direction: column; gap: 16px; width: 320px"
      @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const output = form.querySelector('output');
        if (output) output.textContent = JSON.stringify(Object.fromEntries(new FormData(form)));
      }}
    >
      <su3-text-field name="name" label="Name" required minlength="3" value="Ada"></su3-text-field>
      <su3-text-field
        name="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
      ></su3-text-field>
      <div style="display: flex; gap: 12px">
        <su3-button type="submit">Submit</su3-button>
        <su3-button type="reset" variant="outlined">Reset</su3-button>
      </div>
      <output aria-live="polite"></output>
    </form>
  `,
};

/** Components are re-themed with `--su3-comp-text-field-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-text-field
        label="Pill shaped"
        value="Hello"
        style="--su3-comp-text-field-container-shape: 9999px; --su3-comp-text-field-padding-inline: 1.5rem"
      ></su3-text-field>
    `),
};
