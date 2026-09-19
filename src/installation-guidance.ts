import type { InstallationGuidance } from '@passport/core';

/** Installation instructions belong to the application; core owns their accessible presentation. */
export function installationGuidance(): InstallationGuidance {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (ios) return {
    storageNote: 'On iPhone and iPad, maps and visits saved in this browser do not transfer to the Home Screen app. Add it first to avoid downloading the map twice. Export existing visits to import them in the installed app.',
    steps: [
      { text: 'Open your browser’s Share menu.', shareIcon: true },
      { text: 'Choose Add to Home Screen. Keep Open as Web App enabled if offered, then tap Add.' },
      { text: 'Open the new Home Screen icon while connected. The offline map should start downloading automatically.' },
    ],
  };
  if (/Android/.test(navigator.userAgent) && /Chrome\//.test(navigator.userAgent)) return {
    storageNote: 'In the same Chrome profile, the installed app can reuse your browser’s saved map and visits. We check for an existing map before downloading.',
    steps: [
      { text: 'Open Chrome’s menu and choose Add to Home screen or Install app, if offered.' },
      { text: 'Follow the installation prompt, then open the new app icon while connected.' },
      { text: 'An existing verified map is reused; otherwise the offline map should start downloading automatically.' },
    ],
  };
  return {
    steps: [
      { text: 'Look for Install app in your browser menu or address bar. Installation availability varies by browser.' },
      { text: 'Open the installed app while connected. An existing verified map is reused; otherwise the offline map should start downloading automatically.' },
      { text: 'You can also keep using this browser and choose Download map for offline access.' },
    ],
  };
}
