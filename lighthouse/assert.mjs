#!/usr/bin/env node
/**
 * Fails when a median score is below its target, or when it regressed more than
 * MAX_REGRESSION points against the committed baseline (lighthouse/baseline.json).
 * `--update-baseline` writes the current medians as the new baseline.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { REPORT_DIR, TARGETS, WAIVERS } from './config.mjs'

const MAX_REGRESSION = 3
const baselineUrl = new URL('./baseline.json', import.meta.url)

const summary = JSON.parse(await readFile(new URL('summary.json', REPORT_DIR), 'utf8'))
const current = Object.fromEntries(summary.results.map((r) => [`${r.page}/${r.formFactor}`, r.median.scores]))

if (process.argv.includes('--update-baseline')) {
  await writeFile(baselineUrl, `${JSON.stringify(current, null, 2)}\n`)
  console.log('Baseline updated.')
  process.exit(0)
}

let baseline = {}
try {
  baseline = JSON.parse(await readFile(baselineUrl, 'utf8'))
} catch {
  console.warn('No baseline found — checking targets only.')
}

const failures = []
for (const [key, scores] of Object.entries(current)) {
  for (const [category, target] of Object.entries(TARGETS)) {
    const score = scores[category]
    const waiver = WAIVERS[key]?.[category]
    if (score < target && waiver) console.warn(`waived ${key} ${category}: ${score} < ${target} (${waiver})`)
    else if (score < target) failures.push(`${key} ${category}: ${score} < target ${target}`)
    const previous = baseline[key]?.[category]
    if (previous !== undefined && previous - score > MAX_REGRESSION) {
      failures.push(`${key} ${category}: regressed ${previous} → ${score} (> ${MAX_REGRESSION} pts)`)
    }
  }
  console.log(key, scores)
}

if (failures.length) {
  console.error('\nLighthouse assertions failed:\n' + failures.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}
console.log('\nAll Lighthouse assertions passed.')
