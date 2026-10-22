import { defineElement } from '../../../define-element.ts';
import { Su3Segment } from './segment.ts';

defineElement('su3-segment', Su3Segment);

export { Su3Segment } from './segment.ts';
export type { SegmentPosition, SegmentSelectionMode, SegmentSize } from './segment.ts';
