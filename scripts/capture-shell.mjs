#!/usr/bin/env node
/**
 * Captures the static app shell (header + home hero + loading skeletons) from the
 * production build and writes it to src/app/shell/home-shell.html. The shell is
 * inlined into index.html at build time (vite plugin) so the first paint and the
 * hero LCP happen before any JS runs. Data never enters the shell: the mock
 * worker chunk is held back during capture, so only static UI and skeletons render.
 *
 * Usage: pnpm build && pnpm shell:update   (e2e/specs/13-app-shell.spec.ts checks drift)
 */
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { normalizeShell } from './shell-utils.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const PORT = 4195
const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
})

async function waitForServer(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('preview did not start')
}

try {
  await waitForServer(`http://localhost:${PORT}/`)
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_EXECUTABLE })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  // Hold the mock worker back: requests stay gated, so the UI shows skeletons only.
  await page.route(/\/assets\/(browser|control)-[^/]+\.js$/, () => new Promise(() => {}))
  // Below-the-fold content renders on idle (Deferred); keep it out of the shell.
  await page.addInitScript(() => {
    window.requestIdleCallback = () => 0
  })
  await page.goto(`http://localhost:${PORT}/?shell-capture`)
  await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
  const html = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? '')
  await browser.close()
  const shell = normalizeShell(html)
  await writeFile(new URL('../src/app/shell/home-shell.html', import.meta.url), `${shell}\n`)
  console.log(`Shell captured (${shell.length} chars).`)
} finally {
  preview.kill()
}
