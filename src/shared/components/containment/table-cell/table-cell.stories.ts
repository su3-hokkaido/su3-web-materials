import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './index.ts';
import type { TableCellAlign, TableSortDirection } from './table-cell.ts';

interface TableCellArgs {
  label: string;
  header: boolean;
  align: TableCellAlign;
  sortable: boolean;
  sort: TableSortDirection;
}

const meta: Meta<TableCellArgs> = {
  title: 'Containment/Table Cell',
  component: 'su3-table-cell',
  argTypes: {
    label: { control: 'text', description: 'Content of the default slot (story only).' },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    sort: { control: 'inline-radio', options: ['none', 'ascending', 'descending'] },
  },
  args: { label: 'Engineer', header: false, align: 'start', sortable: false, sort: 'none' },
  render: ({ label, header, align, sortable, sort }) =>
    html`<div style="width: 200px">
      <su3-table-cell ?header=${header} align=${align} ?sortable=${sortable} sort=${sort}
        >${label}</su3-table-cell
      >
    </div>`,
};

export default meta;
type Story = StoryObj<TableCellArgs>;

/**
 * Required: clean URLs point at the Default story. A cell belongs inside a `su3-table-row` of a
 * `su3-data-table`; shown alone it is only a styled box.
 */
export const Default: Story = {};

export const Header: Story = { args: { label: 'Role', header: true } };

export const SortableAscending: Story = {
  args: { label: 'Role', header: true, sortable: true, sort: 'ascending' },
};

export const SortableDescending: Story = {
  args: { label: 'Role', header: true, sortable: true, sort: 'descending' },
};

export const EndAligned: Story = { args: { label: '98', align: 'end' } };
