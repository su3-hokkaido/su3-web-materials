import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../../buttons/button/index.ts';
import '../../feedback/badge/index.ts';
import './index.ts';
import type { DataTableDensity } from './data-table.ts';

interface DataTableArgs {
  density: DataTableDensity;
  selectable: boolean;
  stickyHeader: boolean;
}

const people = [
  { name: 'Ada Lovelace', role: 'Engineer', status: 'Active', score: '98' },
  { name: 'Grace Hopper', role: 'Admiral', status: 'Active', score: '95' },
  { name: 'Alan Turing', role: 'Researcher', status: 'Away', score: '92' },
  { name: 'Katherine Johnson', role: 'Mathematician', status: 'Active', score: '97' },
  { name: 'Margaret Hamilton', role: 'Director', status: 'Offline', score: '99' },
];

const meta: Meta<DataTableArgs> = {
  title: 'Containment/Data Table',
  component: 'su3-data-table',
  argTypes: { density: { control: 'inline-radio', options: ['comfortable', 'compact'] } },
  args: { density: 'comfortable', selectable: false, stickyHeader: false },
  render: ({ density, selectable, stickyHeader }) =>
    html`<su3-data-table
      aria-label="People"
      columns="2fr 1.5fr 1fr 80px"
      density=${density}
      ?selectable=${selectable}
      ?sticky-header=${stickyHeader}
      style="max-width: 640px"
    >
      <su3-table-row header>
        <su3-table-cell sortable sort="ascending">Name</su3-table-cell>
        <su3-table-cell sortable>Role</su3-table-cell>
        <su3-table-cell>Status</su3-table-cell>
        <su3-table-cell align="end" sortable>Score</su3-table-cell>
      </su3-table-row>
      ${people.map(
        (person) =>
          html`<su3-table-row>
            <su3-table-cell>${person.name}</su3-table-cell>
            <su3-table-cell>${person.role}</su3-table-cell>
            <su3-table-cell>${person.status}</su3-table-cell>
            <su3-table-cell align="end">${person.score}</su3-table-cell>
          </su3-table-row>`,
      )}
    </su3-data-table>`,
};

export default meta;
type Story = StoryObj<DataTableArgs>;

/**
 * Required: clean URLs point at the Default story. The header cells with an arrow are sortable; the
 * application orders the rows when the table fires `sort`.
 */
export const Default: Story = { parameters: { vrt: { themed: true } } };

/** Rows can be selected; two are selected here. */
export const Selectable: Story = {
  args: { selectable: true },
  render: ({ density, selectable, stickyHeader }) =>
    html`<su3-data-table
      aria-label="People"
      columns="2fr 1.5fr 1fr 80px"
      density=${density}
      ?selectable=${selectable}
      ?sticky-header=${stickyHeader}
      style="max-width: 640px"
    >
      <su3-table-row header>
        <su3-table-cell>Name</su3-table-cell>
        <su3-table-cell>Role</su3-table-cell>
        <su3-table-cell>Status</su3-table-cell>
        <su3-table-cell align="end">Score</su3-table-cell>
      </su3-table-row>
      ${people.map(
        (person, index) =>
          html`<su3-table-row ?selected=${index === 1 || index === 3}>
            <su3-table-cell>${person.name}</su3-table-cell>
            <su3-table-cell>${person.role}</su3-table-cell>
            <su3-table-cell>${person.status}</su3-table-cell>
            <su3-table-cell align="end">${person.score}</su3-table-cell>
          </su3-table-row>`,
      )}
    </su3-data-table>`,
};

export const Compact: Story = { args: { density: 'compact' } };

/** Limited in height, the rows scroll under the sticky header. */
export const StickyHeader: Story = {
  args: { stickyHeader: true },
  render: ({ density, selectable, stickyHeader }) =>
    html`<su3-data-table
      aria-label="People"
      columns="2fr 1fr"
      density=${density}
      ?selectable=${selectable}
      ?sticky-header=${stickyHeader}
      style="max-width: 360px; --su3-comp-data-table-max-height: 16rem"
    >
      <su3-table-row header>
        <su3-table-cell>Name</su3-table-cell>
        <su3-table-cell align="end">Score</su3-table-cell>
      </su3-table-row>
      ${[...people, ...people].map(
        (person) =>
          html`<su3-table-row>
            <su3-table-cell>${person.name}</su3-table-cell>
            <su3-table-cell align="end">${person.score}</su3-table-cell>
          </su3-table-row>`,
      )}
    </su3-data-table>`,
};

/** Cells can hold other components. */
export const WithComponents: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html`<su3-data-table aria-label="Orders" columns="1fr 1fr 120px" style="max-width: 520px">
      <su3-table-row header>
        <su3-table-cell>Order</su3-table-cell>
        <su3-table-cell>State</su3-table-cell>
        <su3-table-cell align="end">Action</su3-table-cell>
      </su3-table-row>
      <su3-table-row>
        <su3-table-cell>#1042</su3-table-cell>
        <su3-table-cell><su3-badge tone="danger" count="2"></su3-badge></su3-table-cell>
        <su3-table-cell align="end"><su3-button variant="text">Open</su3-button></su3-table-cell>
      </su3-table-row>
      <su3-table-row>
        <su3-table-cell>#1043</su3-table-cell>
        <su3-table-cell>Shipped</su3-table-cell>
        <su3-table-cell align="end"><su3-button variant="text">Open</su3-button></su3-table-cell>
      </su3-table-row>
    </su3-data-table>`,
};
