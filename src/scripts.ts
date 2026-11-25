const PRIMARY_SCRIPT = 'https://service.mtcaptcha.com/mtcv1/client/mtcaptcha.min.js';
const SECONDARY_SCRIPT = 'https://service2.mtcaptcha.com/mtcv1/client/mtcaptcha2.min.js';

const PRIMARY_SCRIPT_ID = 'svelte-mtcaptcha-script';
const SECONDARY_SCRIPT_ID = 'svelte-mtcaptcha-script-secondary';

let loadPromise: Promise<void> | null = null;

function appendScript(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load ${src}`));
    };
    const parent = document.head || document.body;
    parent.appendChild(script);
  });
}

/**
 * Injects the MTCaptcha client scripts once per page.
 * Resolves when the primary script has loaded.
 */
export function ensureMTCaptchaScripts(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = Promise.all([
      appendScript(PRIMARY_SCRIPT_ID, PRIMARY_SCRIPT),
      appendScript(SECONDARY_SCRIPT_ID, SECONDARY_SCRIPT).catch(() => undefined),
    ]).then(() => undefined);
  }
  return loadPromise;
}
