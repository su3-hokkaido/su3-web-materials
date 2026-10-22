import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { SegmentSize } from '../segment/segment.ts';
import '../button/index.ts';
import './index.ts';

interface SegmentedButtonArgs {
  size: SegmentSize;
  multiple: boolean;
  required: boolean;
  disabled: boolean;
}

const sizes: readonly SegmentSize[] = ['sm', 'md', 'lg'];

const meta: Meta<SegmentedButtonArgs> = {
  title: 'Buttons/Segmented Button',
  component: 'su3-segmented-button',
  argTypes: { size: { control: 'inline-radio', options: sizes } },
  args: { size: 'md', multiple: false, required: false, disabled: false },
  render: ({ size, multiple, required, disabled }) =>
    html`<su3-segmented-button
      aria-label="Range"
      size=${size}
      ?multiple=${multiple}
      ?required=${required}
      ?disabled=${disabled}
    >
      <su3-segment value="day" selected>Day</su3-segment>
      <su3-segment value="week">Week</su3-segment>
      <su3-segment value="month">Month</su3-segment>
    </su3-segmented-button>`,
};

export default meta;
type Story = StoryObj<SegmentedButtonArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

/** Three sizes. Shows the theme effect in every product. */
export const Sizes: Story = {
  parameters: { controls: { disable: true }, vrt: { themed: true } },
  render: () =>
    html`<div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
      ${sizes.map(
        (size) =>
          html`<su3-segmented-button aria-label=${`Range (${size})`} size=${size}>
            <su3-segment value="day" selected>Day</su3-segment>
            <su3-segment value="week">Week</su3-segment>
            <su3-segment value="month">Month</su3-segment>
          </su3-segmented-button>`,
      )}
    </div>`,
};

/** With `multiple` every segment toggles independently. */
export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-segmented-button aria-label="Filters" multiple>
      <su3-segment value="free" selected>Free</su3-segment>
      <su3-segment value="paid">Paid</su3-segment>
      <su3-segment value="trial" selected>Trial</su3-segment>
    </su3-segmented-button>`,
};

/** A disabled segment is skipped by the arrow keys; a disabled group disables all of them. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
      <su3-segmented-button aria-label="One disabled">
        <su3-segment value="a" selected>First</su3-segment>
        <su3-segment value="b" disabled>Second</su3-segment>
        <su3-segment value="c">Third</su3-segment>
      </su3-segmented-button>
      <su3-segmented-button aria-label="Group disabled" disabled>
        <su3-segment value="a" selected>First</su3-segment>
        <su3-segment value="b">Second</su3-segment>
      </su3-segmented-button>
    </div>`,
};

/** A segment can hold an icon next to its label, or only an icon with `aria-label`. */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-segmented-button aria-label="Alignment">
      ${[
        ['left', 'M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z'],
        ['center', 'M3 5h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z'],
        ['right', 'M3 5h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9z'],
      ].map(
        ([name, path]) =>
          html`<su3-segment
            value=${name ?? ''}
            aria-label=${`Align ${name ?? ''}`}
            ?selected=${name === 'left'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d=${path ?? ''} />
            </svg>
          </su3-segment>`,
      )}
    </su3-segmented-button>`,
};

/** In a form: the selected value is submitted; Reset returns to the initial selection. */
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
      <su3-segmented-button name="range" aria-label="Range" required>
        <su3-segment value="day">Day</su3-segment>
        <su3-segment value="week" selected>Week</su3-segment>
        <su3-segment value="month">Month</su3-segment>
      </su3-segmented-button>
      <div style="display: flex; gap: 12px">
        <su3-button type="submit">Submit</su3-button>
        <su3-button type="reset" variant="outlined">Reset</su3-button>
      </div>
      <output></output>
    </form>
  `,
};

/** Components are re-themed with `--su3-comp-segmented-button-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-segmented-button
      aria-label="Range"
      style="--su3-comp-segmented-button-container-shape: 4px; --su3-comp-segmented-button-selected-container-color: #fff4d6; --su3-comp-segmented-button-selected-label-color: #2b2100; --su3-comp-segmented-button-border-color: #8a3ffc"
    >
      <su3-segment value="day" selected>Day</su3-segment>
      <su3-segment value="week">Week</su3-segment>
      <su3-segment value="month">Month</su3-segment>
    </su3-segmented-button>`,
};
