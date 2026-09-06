import { PassportApp } from '@passport/core';
import '@passport/core/styles.css';
import { flyWashingtonProgram } from './program/program';

const app = new PassportApp({ program: flyWashingtonProgram });
app.mount('#app').catch(() => {
  document.querySelector('#app')!.textContent = 'The passport could not start. Reload this page and check that your browser permits local storage.';
});
if (import.meta.hot) import.meta.hot.dispose(() => void app.destroy());
