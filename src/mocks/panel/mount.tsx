import { createRoot } from 'react-dom/client'
import type { MockControl } from '../control'
import { ScenarioPanel } from './scenario-panel'

/** Mounts the scenario panel in its own root, outside the app tree. */
export function mountScenarioPanel(control: MockControl) {
  const host = document.createElement('div')
  host.id = 'kurio-scenario-panel'
  document.body.append(host)
  createRoot(host).render(<ScenarioPanel control={control} />)
}
