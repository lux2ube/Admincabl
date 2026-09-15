import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const bootLoader = document.getElementById('boot-loader');

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

if (bootLoader) {
  const bootImage = bootLoader.querySelector('img');
  const imageReady = !bootImage || bootImage.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
      bootImage.addEventListener('load', () => resolve(), { once: true });
      bootImage.addEventListener('error', () => resolve(), { once: true });
    });
  const minimumDisplayTime = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 900);
  });
  Promise.all([imageReady, minimumDisplayTime]).then(() => {
    window.requestAnimationFrame(() => {
    bootLoader.classList.add('is-hidden');
    window.setTimeout(() => bootLoader.remove(), 450);
    });
  });
}
