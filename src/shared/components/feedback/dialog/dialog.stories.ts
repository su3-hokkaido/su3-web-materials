import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import { Su3Dialog } from './index.ts';

interface DialogArgs {
  headline: string;
  text: string;
  open: boolean;
  persistent: boolean;
  alert: boolean;
  fullscreen: boolean;
}

const meta: Meta<DialogArgs> = {
  title: 'Feedback/Dialog',
  component: 'su3-dialog',
  argTypes: {
    headline: { control: 'text', description: 'Content of the `headline` slot (story only).' },
    text: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: {
    headline: 'Discard draft?',
    text: 'Your draft has not been sent. If you discard it, the text you wrote is lost.',
    open: true,
    persistent: false,
    alert: false,
    fullscreen: false,
  },
  parameters: { docs: { story: { inline: false, iframeHeight: 420 } } },
  render: ({ headline, text, open, persistent, alert, fullscreen }) =>
    html`<su3-dialog
      ?open=${open}
      ?persistent=${persistent}
      ?alert=${alert}
      ?fullscreen=${fullscreen}
    >
      <span slot="headline">${headline}</span>
      <div>${text}</div>
      <su3-button slot="actions" variant="text" dialog-action="cancel">Keep editing</su3-button>
      <su3-button slot="actions" variant="text" dialog-action="discard">Discard</su3-button>
    </su3-dialog>`,
};

export default meta;
type Story = StoryObj<DialogArgs>;

/**
 * Required: clean URLs point at the Default story. It starts open so the catalog and the
 * screenshots show it; in an app the application sets `open`.
 */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** A message that needs an answer: `alertdialog`, and Escape and the scrim do nothing. */
export const Alert: Story = {
  args: {
    headline: 'Delete account?',
    text: 'This removes your account and every project in it. It cannot be undone.',
    persistent: true,
    alert: true,
  },
};

/** Long content scrolls inside the dialog while the headline and actions stay in place. */
export const LongContent: Story = {
  args: {
    text: Array.from(
      { length: 24 },
      (_, index) => `Line ${String(index + 1)} of a long text that needs room.`,
    ).join(' '),
  },
};

/** Closed by default; the button opens it and focus returns to the button when it closes. */
export const WithOpener: Story = {
  args: { open: false },
  parameters: { controls: { disable: true }, vrt: { disable: true } },
  render: ({ headline, text }) =>
    html`<su3-button
        @click=${(event: Event) => {
          const root =
            event.currentTarget instanceof Element ? event.currentTarget.parentElement : null;
          const dialog = root?.querySelector('su3-dialog');
          if (dialog instanceof Su3Dialog) dialog.open = true;
        }}
        >Open dialog</su3-button
      >
      <su3-dialog>
        <span slot="headline">${headline}</span>
        <div>${text}</div>
        <su3-button slot="actions" variant="text" dialog-action="cancel">Cancel</su3-button>
        <su3-button slot="actions" variant="text" dialog-action="ok">OK</su3-button>
      </su3-dialog>`,
};
