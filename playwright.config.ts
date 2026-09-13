import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build -- --outDir dist-e2e && npm run preview -- --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] } } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'], launchOptions: { executablePath: process.env.WEBKIT_PATH } } },
  ],
});
