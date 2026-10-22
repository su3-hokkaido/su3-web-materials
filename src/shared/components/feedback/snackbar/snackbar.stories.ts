import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import { Su3Snackbar } from './index.ts';

interface SnackbarArgs {
  message: string;
  open: boolean;
  duration: number;
  dismissible: boolean;
}

const meta: Meta<SnackbarArgs> = {
  title: 'Feedback/Snackbar',
  component: 'su3-snackbar',
  argTypes: {
    message: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { message: 'Message archived', open: true, duration: 0, dismissible: false },
  render: ({ message, open, duration, dismissible }) =>
    html`<su3-snackbar ?open=${open} duration=${duration} ?dismissible=${dismissible}>
      ${message}
      <su3-button slot="action" variant="text">Undo</su3-button>
    </su3-snackbar>`,
};

export default meta;
type Story = StoryObj<SnackbarArgs>;

/**
 * Required: clean URLs point at the Default story. It is open and persistent (`duration` 0) so the
 * catalog and the screenshots show it; in an app it closes itself after 4 seconds.
 */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** With a close button. */
export const Dismissible: Story = { args: { dismissible: true } };

/** Only a message: no action. */
export const MessageOnly: Story = {
  render: ({ message, open, duration }) =>
    html`<su3-snackbar ?open=${open} duration=${duration}>${message}</su3-snackbar>`,
};

/** A long message wraps inside the maximum width. */
export const LongMessage: Story = {
  args: {
    message:
      'Your changes were saved, but three of the attached files are larger than the limit and were skipped.',
    dismissible: true,
  },
};

/** Closed by default; the button opens it for 4 seconds and the timer pauses on hover and focus. */
export const Timed: Story = {
  parameters: { controls: { disable: true }, vrt: { disable: true } },
  render: () =>
    html`<su3-button
        @click=${(event: Event) => {
          const target = event.currentTarget;
          const snackbar = target instanceof Element ? target.nextElementSibling : null;
          if (snackbar instanceof Su3Snackbar) snackbar.open = true;
        }}
        >Show snackbar</su3-button
      >
      <su3-snackbar duration="4000" dismissible
        >Saved<su3-button slot="action" variant="text">Undo</su3-button></su3-snackbar
      >`,
};
