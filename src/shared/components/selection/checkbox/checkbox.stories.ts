import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import '../../buttons/button/index.ts'; // used by the InForm story
import './index.ts';

interface CheckboxArgs {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
}

const column = (content: unknown) =>
  html`<div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start">
    ${content}
  </div>`;

const meta: Meta<CheckboxArgs> = {
  title: 'Selection/Checkbox',
  component: 'su3-checkbox',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: {
    label: 'Accept the terms',
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
  },
  render: ({ label, checked, indeterminate, disabled, required }) =>
    html`<su3-checkbox
      ?checked=${checked}
      ?indeterminate=${indeterminate}
      ?disabled=${disabled}
      ?required=${required}
      >${label || nothing}</su3-checkbox
    >`,
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

/** The three visual states of the box. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-checkbox>Unchecked</su3-checkbox>
      <su3-checkbox checked>Checked</su3-checkbox>
      <su3-checkbox indeterminate>Indeterminate</su3-checkbox>
    `),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-checkbox disabled>Disabled</su3-checkbox>
      <su3-checkbox disabled checked>Disabled and checked</su3-checkbox>
      <su3-checkbox disabled indeterminate>Disabled and indeterminate</su3-checkbox>
    `),
};

/** Without visible text the control needs an `aria-label`. */
export const WithoutLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<su3-checkbox aria-label="Select row"></su3-checkbox>`,
};

/** Required in a form: submitting without checking it is blocked; Reset restores the initial state. */
export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start"
      @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const output = form.querySelector('output');
        if (output) output.textContent = JSON.stringify(Object.fromEntries(new FormData(form)));
      }}
    >
      <su3-checkbox name="terms" value="accepted" required>Accept the terms</su3-checkbox>
      <su3-checkbox name="news" checked>Send me news</su3-checkbox>
      <div style="display: flex; gap: 12px">
        <su3-button type="submit">Submit</su3-button>
        <su3-button type="reset" variant="outlined">Reset</su3-button>
      </div>
      <output aria-live="polite"></output>
    </form>
  `,
};

/** Components are re-themed with `--su3-comp-checkbox-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <su3-checkbox
      checked
      style="--su3-comp-checkbox-selected-container-color: #8a3ffc; --su3-comp-checkbox-container-shape: 9999px"
    >
      Round and violet
    </su3-checkbox>
  `,
};
