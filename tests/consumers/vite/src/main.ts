import 'su3-web-materials/tokens.css';
import 'su3-web-materials/button.js';
import type { ButtonVariant } from 'su3-web-materials';

// `document.createElement('su3-button')` is typed as Su3Button through HTMLElementTagNameMap.
const button = document.createElement('su3-button');
const variant: ButtonVariant = 'filled';
button.variant = variant;
button.textContent = 'Save';
button.id = 'subject';
document.body.append(button);
