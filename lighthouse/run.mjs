#!/usr/bin/env node
/**
 * Runs Lighthouse RUNS times per page × form factor against `vite preview`,
 * keeps the median run (Lighthouse's own computeMedianRun) and writes:
 *   lighthouse/reports/<page>-<formFactor>.report.{html,json}  (median run)
 *   lighthouse/reports/summary.json + summary.md               (all runs, medians, env)
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { computeMedianRun } from 'lighthouse/core/lib/median-run.js'
import { chromium } from 'playwright-core'
import { BASE_URL, FORM_FACTORS, PAGES, PORT, REPORT_DIR, RUNS } from './config.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`Preview server did not start at ${url}`)
}

function startPreview() {
  if (process.env.LH_BASE_URL) return null
  const child = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  })
  return child
}

function pickMetrics(lhr) {
  const audit = (id) => lhr.audits[id]?.numericValue ?? null
  return {
    scores: Object.fromEntries(
      CATEGORIES.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
    ),
    lcpMs: Math.round(audit('largest-contentful-paint')),
    fcpMs: Math.round(audit('first-contentful-paint')),
    tbtMs: Math.round(audit('total-blocking-time')),
    cls: Number((audit('cumulative-layout-shift') ?? 0).toFixed(4)),
    speedIndexMs: Math.round(audit('speed-index')),
  }
}

async function main() {
  const chromePath = process.env.CHROME_PATH ?? chromium.executablePath()
  await mkdir(REPORT_DIR, { recursive: true })
  const preview = startPreview()
  try {
    await waitForServer(BASE_URL)
    const results = []
    const env = { browser: 'unknown', lighthouse: 'unknown' }
    for (const page of PAGES) {
      for (const formFactor of FORM_FACTORS) {
        const runs = []
        for (let i = 0; i < RUNS; i++) {
          // Fresh browser per run: no warm HTTP cache, service worker or storage carried over.
          const chrome = await chromeLauncher.launch({
            chromePath,
            chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
          })
          try {
            const config = formFactor === 'desktop' ? desktopConfig : undefined
            const result = await lighthouse(
              `${BASE_URL}${page.path}`,
              { port: chrome.port, output: ['html', 'json'], onlyCategories: CATEGORIES, logLevel: 'error' },
              config,
            )
            if (!result) throw new Error('Lighthouse returned no result')
            runs.push({ lhr: result.lhr, report: result.report })
            env.browser = result.lhr.environment.hostUserAgent
            env.lighthouse = result.lhr.lighthouseVersion
            const m = pickMetrics(result.lhr)
            console.log(
              `${page.id}/${formFactor} run ${i + 1}/${RUNS}:`,
              m.scores,
              `LCP ${m.lcpMs}ms TBT ${m.tbtMs}ms CLS ${m.cls}`,
            )
          } finally {
            await chrome.kill()
          }
        }
        const median = computeMedianRun(runs.map((run) => run.lhr))
        const medianRun = runs.find((run) => run.lhr === median) ?? runs[0]
        const base = `${page.id}-${formFactor}`
        const [html, json] = medianRun.report
        await writeFile(new URL(`${base}.report.html`, REPORT_DIR), html)
        await writeFile(new URL(`${base}.report.json`, REPORT_DIR), json)
        results.push({
          page: page.id,
          path: page.path,
          formFactor,
          median: pickMetrics(median),
          runs: runs.map((run) => pickMetrics(run.lhr)),
        })
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      runsPerPage: RUNS,
      selection: 'median run (lighthouse computeMedianRun: FCP + LCP closest to the median)',
      environment: {
        lighthouse: env.lighthouse,
        node: process.version,
        browser: env.browser,
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        cpus: os.cpus().length,
        server: 'vite preview (production build, default mock scenario)',
        throttling:
          'Lighthouse defaults — mobile: simulated slow 4G + 4× CPU; desktop: desktop-config preset',
      },
      results,
    }
    await writeFile(new URL('summary.json', REPORT_DIR), `${JSON.stringify(summary, null, 2)}\n`)
    await writeFile(new URL('summary.md', REPORT_DIR), toMarkdown(summary))
    console.log('\nMedians:')
    for (const r of results) console.log(` ${r.page}/${r.formFactor}`, r.median.scores)
  } finally {
    preview?.kill()
  }
}

function toMarkdown(summary) {
  const lines = [
    '# Lighthouse — mediana de 3 execuções',
    '',
    `Gerado em ${summary.generatedAt}. Seleção: ${summary.selection}.`,
    '',
    '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...summary.results.map(
      ({ page, formFactor, median: m }) =>
        `| ${page} | ${formFactor} | ${m.scores.performance} | ${m.scores.accessibility} | ${m.scores['best-practices']} | ${m.scores.seo} | ${m.lcpMs} ms | ${m.tbtMs} ms | ${m.cls} |`,
    ),
    '',
    '## Ambiente',
    '',
    ...Object.entries(summary.environment).map(([key, value]) => `- **${key}**: ${value}`),
    '',
  ]
  return `${lines.join('\n')}\n`
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
