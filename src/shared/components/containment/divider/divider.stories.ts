import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';
import type { DividerOrientation } from './divider.ts';

interface DividerArgs {
  orientation: DividerOrientation;
  inset: boolean;
  decorative: boolean;
}

const meta: Meta<DividerArgs> = {
  title: 'Containment/Divider',
  component: 'su3-divider',
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  args: { orientation: 'horizontal', inset: false, decorative: false },
  render: ({ orientation, inset, decorative }) =>
    html`<div
      style="display: flex; flex-direction: ${orientation === 'vertical' ? 'row' : 'column'}; gap: 12px; width: 280px; height: 72px; align-items: stretch; justify-content: center"
    >
      <span>First</span>
      <su3-divider
        ?inset=${inset}
        ?decorative=${decorative}
        orientation=${orientation}
      ></su3-divider>
      <span>Second</span>
    </div>`,
};

export default meta;
type Story = StoryObj<DividerArgs>;

/** Required: clean URLs point at the Default story. */
export const Default: Story = {};

export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; width: 320px">
      <div>
        <p style="margin: 0 0 8px">Horizontal</p>
        <su3-divider></su3-divider>
        <p style="margin: 8px 0 0">and inset</p>
        <su3-divider inset></su3-divider>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; height: 56px">
        <span>One</span>
        <su3-divider orientation="vertical"></su3-divider>
        <span>Two</span>
        <su3-divider orientation="vertical" inset></su3-divider>
        <span>Three (inset)</span>
      </div>
    </div>
  `,
};

/** In a list: dividers between rows, the last row without one. */
export const InAList: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width: 280px">
      <div style="padding: 12px 0">Inbox</div>
      <su3-divider inset></su3-divider>
      <div style="padding: 12px 0">Drafts</div>
      <su3-divider inset></su3-divider>
      <div style="padding: 12px 0">Sent</div>
    </div>
  `,
};

/** Components are re-themed with `--su3-comp-divider-*`. */
export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width: 280px">
      <su3-divider
        style="--su3-comp-divider-color: #8a3ffc; --su3-comp-divider-thickness: 4px"
      ></su3-divider>
    </div>
  `,
};
