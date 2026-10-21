import 'su3-web-materials/tokens.css';
import 'su3-web-materials/themes/acme.css';
import 'su3-web-materials/button.js';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);
  return (
    <su3-button id="subject" variant="filled" type="button" onClick={() => setCount(count + 1)}>
      Clicked {count}
    </su3-button>
  );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
