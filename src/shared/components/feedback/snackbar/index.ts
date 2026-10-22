import { defineElement } from '../../../define-element.ts';
import { Su3Snackbar } from './snackbar.ts';

defineElement('su3-snackbar', Su3Snackbar);

export { Su3Snackbar } from './snackbar.ts';
export type { SnackbarCloseDetail, SnackbarCloseReason } from './snackbar.ts';
