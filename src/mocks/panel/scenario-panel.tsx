import { FlaskConicalIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import type { MockControl } from '../control'

/** App storage (session, guest cart id, checkout drafts) — mock keys are kept. */
function clearAppStorage() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('kurio:') && !key.startsWith('kurio:mock-')) storage.removeItem(key)
    }
  }
}

/**
 * Dev / demo panel to pick a deterministic scenario and reset the simulated
 * backend. It only talks to the mock control surface (server side); the app
 * reacts through its normal REST + Socket.IO paths after a reload.
 */
export function ScenarioPanel({ control }: { control: MockControl }) {
  const [selected, setSelected] = useState(control.getScenario())
  const [busy, setBusy] = useState(false)
  const groupId = useId()

  const apply = async (resetData: boolean) => {
    setBusy(true)
    if (resetData) {
      await control.reset(selected)
      clearAppStorage()
    } else {
      await control.setScenario(selected)
    }
    const url = new URL(location.href)
    url.searchParams.delete('scenario')
    url.searchParams.delete('mock-reset')
    location.assign(resetData ? '/' : url.toString())
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full border border-border-soft bg-surface-dark px-3 py-2 text-caption text-text-secondary shadow-lg hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary md:bottom-4"
        >
          <FlaskConicalIcon aria-hidden="true" className="size-4" />
          Cenários
          <span className="sr-only">de simulação (atual: {control.getScenario()})</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-6">
        <SheetTitle>Cenários de simulação</SheetTitle>
        <SheetDescription>
          Backend simulado (MSW). Também selecionável por <code>?scenario=&lt;id&gt;</code>; adicione{' '}
          <code>&amp;mock-reset</code> para restaurar os dados.
        </SheetDescription>
        <fieldset aria-labelledby={`${groupId}-legend`} className="flex flex-col gap-2">
          <legend id={`${groupId}-legend`} className="sr-only">
            Cenário
          </legend>
          {control.scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="flex gap-3 rounded-xl border border-border p-3 has-checked:border-primary"
            >
              <input
                type="radio"
                id={`${groupId}-${scenario.id}`}
                name={groupId}
                value={scenario.id}
                checked={selected === scenario.id}
                onChange={() => setSelected(scenario.id)}
                aria-describedby={`${groupId}-${scenario.id}-desc`}
                className="mt-1 accent-primary"
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${groupId}-${scenario.id}`}
                  className="cursor-pointer text-body font-medium text-text-primary"
                >
                  {scenario.label}
                </label>
                <span id={`${groupId}-${scenario.id}-desc`} className="text-caption text-text-secondary">
                  {scenario.description} <code className="text-text-accent">{scenario.id}</code>
                </span>
              </div>
            </div>
          ))}
        </fieldset>
        <div className="flex flex-col gap-2">
          <Button type="button" disabled={busy} onClick={() => void apply(false)}>
            Aplicar e recarregar
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void apply(true)}>
            Aplicar e resetar dados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
