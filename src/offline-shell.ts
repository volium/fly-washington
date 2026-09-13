/** Deployment owns the small PWA shell; package storage remains in core. */
export async function offlineShellReady(): Promise<boolean> {
  if (!navigator.serviceWorker?.controller || !('caches' in window)) return false;
  const root = new URL(import.meta.env.BASE_URL, location.origin);
  const cached = await caches.match(new URL('index.html', root), { ignoreSearch: true });
  if (!cached) return false;
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map(s => s.src);
  return (await Promise.all(scripts.map(url => caches.match(url, { ignoreSearch: true })))).every(Boolean);
}
