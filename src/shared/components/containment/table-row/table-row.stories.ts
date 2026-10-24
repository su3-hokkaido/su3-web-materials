import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';

interface TableRowArgs {
  header: boolean;
  selected: boolean;
}

const meta: Meta<TableRowArgs> = {
  title: 'Containment/Table Row',
  component: 'su3-table-row',
  args: { header: false, selected: false },
  render: ({ header, selected }) =>
    html`<div style="width: 420px">
      <su3-table-row ?header=${header} ?selected=${selected}>
        <su3-table-cell>Ada Lovelace</su3-table-cell>
        <su3-table-cell>Engineer</su3-table-cell>
        <su3-table-cell align="end">98</su3-table-cell>
      </su3-table-row>
    </div>`,
};

export default meta;
type Story = StoryObj<TableRowArgs>;

/**
 * Required: clean URLs point at the Default story. A row belongs inside a `su3-data-table`, which
 * shares its columns and handles selection; shown alone it only lays its cells out equally.
 */
export const Default: Story = {};

export const Header: Story = { args: { header: true } };

export const Selected: Story = { args: { selected: true } };
