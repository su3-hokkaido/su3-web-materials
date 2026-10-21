import 'su3-web-materials/tokens.css';
// all.js registers every component; `button.js` would register only the button.
import 'su3-web-materials/all.js';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
