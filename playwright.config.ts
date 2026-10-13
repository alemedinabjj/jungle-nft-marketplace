import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = `http://localhost:${PORT}`
// Optional override for sandboxes without browser downloads; CI uses the bundled Chromium.
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE

/**
 * E2E runs against the optimized production build with mocks enabled —
 * the same artifact that is deployed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.25, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/visual/__snapshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: executablePath ? 'off' : 'retain-on-failure',
    locale: 'pt-BR',
    // Deterministic rendering: no shimmer, no transitions.
    contextOptions: { reducedMotion: 'reduce' },
    ...(executablePath && { launchOptions: { executablePath } }),
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    // Functional flows (12 specs) on desktop and mobile Chromium.
    {
      name: 'desktop',
      testMatch: 'specs/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: 'specs/**/*.spec.ts',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    // Visual regression at the three reference widths.
    {
      name: 'visual-1440',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'visual-768',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'visual-390',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'pnpm preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
