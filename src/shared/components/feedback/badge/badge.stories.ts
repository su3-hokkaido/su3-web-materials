import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/icon-button/index.ts';
import './index.ts';
import type { BadgeTone } from './badge.ts';

interface BadgeArgs {
  tone: BadgeTone;
  label: string;
}

const tones: readonly BadgeTone[] = ['accent', 'subtle', 'danger', 'neutral'];

const meta: Meta<BadgeArgs> = {
  title: 'Feedback/Badge',
  component: 'su3-badge',
  argTypes: {
    tone: { control: 'inline-radio', options: tones },
    label: { control: 'text', description: 'Content of the default slot (story only).' },
  },
  args: { tone: 'accent', label: 'New' },
  render: ({ tone, label }) => html`<su3-badge tone=${tone}>${label}</su3-badge>`,
};

export default meta;
type Story = StoryObj<BadgeArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

/** The four tones. Shows the theme effect in every product. */
export const Tones: Story = {
  parameters: { controls: { disable: true }, vrt: { themed: true } },
  render: () =>
    html`<div style="display: flex; gap: 12px; align-items: center">
      ${tones.map((tone) => html`<su3-badge tone=${tone}>${tone}</su3-badge>`)}
    </div>`,
};

/** A count above `max` is shown as `max+`; assistive technology hears the full number. */
export const Counts: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="display: flex; gap: 12px; align-items: center">
      <su3-badge count="1"></su3-badge>
      <su3-badge count="12" tone="danger"></su3-badge>
      <su3-badge count="120"></su3-badge>
      <su3-badge count="12" max="9" tone="subtle"></su3-badge>
    </div>`,
};

/** A dot has no text: always give it an `aria-label`. */
export const Dot: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<div style="display: flex; gap: 12px; align-items: center">
      <su3-badge dot aria-label="Online"></su3-badge>
      <su3-badge dot tone="danger" aria-label="Offline"></su3-badge>
      <su3-badge dot tone="neutral" aria-label="Unknown"></su3-badge>
    </div>`,
};

/** Placed over another element: the author positions the badge. */
export const OnAButton: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<span style="position: relative; display: inline-block">
      <su3-icon-button aria-label="Notifications, 3 unread" variant="tonal">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1z"
          />
        </svg>
      </su3-icon-button>
      <su3-badge
        count="3"
        tone="danger"
        aria-hidden="true"
        style="position: absolute; top: -4px; right: -4px"
      ></su3-badge>
    </span>`,
};

/** Components are re-themed with `--su3-comp-badge-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-badge
      style="--su3-comp-badge-container-color: #fff4d6; --su3-comp-badge-label-color: #2b2100; --su3-comp-badge-container-shape: 4px; --su3-comp-badge-height: 32px; --su3-comp-badge-padding-inline: 16px"
      >Beta</su3-badge
    >`,
};
