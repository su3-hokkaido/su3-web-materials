import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import './index.ts';
import type { TooltipPlacement } from './tooltip.ts';

interface TooltipArgs {
  text: string;
  open: boolean;
  placement: TooltipPlacement;
  delay: number;
  disabled: boolean;
}

const meta: Meta<TooltipArgs> = {
  title: 'Feedback/Tooltip',
  component: 'su3-tooltip',
  argTypes: {
    text: { control: 'text', description: 'Content of the `content` slot (story only).' },
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] },
  },
  args: { text: 'Save changes', open: true, placement: 'top', delay: 500, disabled: false },
  render: ({ text, open, placement, delay, disabled }) =>
    html`<div style="padding: 4rem 6rem">
      <su3-tooltip ?open=${open} placement=${placement} delay=${delay} ?disabled=${disabled}>
        <su3-button>Save</su3-button>
        <span slot="content">${text}</span>
      </su3-tooltip>
    </div>`,
};

export default meta;
type Story = StoryObj<TooltipArgs>;

/**
 * Required: clean URLs point at the Default story. It is open so the catalog and the screenshots
 * show it; in an app it appears on hover and focus.
 */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** The four placements; each flips when it does not fit. */
export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div
      style="display: grid; grid-template-columns: repeat(2, max-content); gap: 5rem 9rem; padding: 4rem 8rem"
    >
      ${(['top', 'bottom', 'start', 'end'] as const).map(
        (placement) =>
          html`<su3-tooltip open placement=${placement}>
            <su3-button variant="outlined">${placement}</su3-button>
            <span slot="content">Placed ${placement}</span>
          </su3-tooltip>`,
      )}
    </div>`,
};

/** A long description wraps inside the maximum width. */
export const LongText: Story = {
  args: {
    text: 'Saves the document to the shared folder and notifies everyone who follows it.',
  },
};

/** Closed by default: hover or tab to the button. Escape dismisses it. */
export const Interactive: Story = {
  args: { open: false },
  parameters: { controls: { disable: true }, vrt: { disable: true } },
};
