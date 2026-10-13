import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

export interface Crumb {
  label: string
  to?: '/' | '/cart'
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-body font-bold text-text-primary">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <li aria-hidden="true" className="px-1">
                /
              </li>
            )}
            <li>
              {item.to && index < items.length - 1 ? (
                <Link to={item.to} className="hover:text-text-accent">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
