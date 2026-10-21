import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';
import '../../buttons/button/index.ts'; // used by the InForm story
import './index.ts';

interface SwitchArgs {
  label: string;
  checked: boolean;
  disabled: boolean;
  required: boolean;
}

const column = (content: unknown) =>
  html`<div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start">
    ${content}
  </div>`;

const meta: Meta<SwitchArgs> = {
  title: 'Selection/Switch',
  component: 'su3-switch',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { label: 'Notifications', checked: false, disabled: false, required: false },
  render: ({ label, checked, disabled, required }) =>
    html`<su3-switch ?checked=${checked} ?disabled=${disabled} ?required=${required}
      >${label || nothing}</su3-switch
    >`,
};

export default meta;
type Story = StoryObj<SwitchArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-switch>Off</su3-switch>
      <su3-switch checked>On</su3-switch>
    `),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    column(html`
      <su3-switch disabled>Disabled and off</su3-switch>
      <su3-switch disabled checked>Disabled and on</su3-switch>
    `),
};

/** Without visible text the control needs an `aria-label`. */
export const WithoutLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<su3-switch aria-label="Enable dark mode" checked></su3-switch>`,
};

/** A switch in a form submits `name=value` while on; Reset restores the initial state. */
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
      <su3-switch name="email" value="yes" checked>Email updates</su3-switch>
      <su3-switch name="sms">SMS updates</su3-switch>
      <div style="display: flex; gap: 12px">
        <su3-button type="submit">Save</su3-button>
        <su3-button type="reset" variant="outlined">Reset</su3-button>
      </div>
      <output aria-live="polite"></output>
    </form>
  `,
};

/** Components are re-themed with `--su3-comp-switch-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <su3-switch
      checked
      style="--su3-comp-switch-selected-track-color: #8a3ffc; --su3-comp-switch-track-width: 3.5rem"
    >
      Wide and violet
    </su3-switch>
  `,
};
