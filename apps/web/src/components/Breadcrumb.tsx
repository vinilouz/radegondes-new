import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { useQuery } from '@tanstack/react-query'

type BreadcrumbItem = {
  label: string
  href: string | null
  icon?: React.ComponentType<{ className?: string }> | null
}

export function Breadcrumb() {
  const location = useLocation()
  const pathname = location.pathname

  if (pathname === '/planos') {
    return null
  }

  const studyMatch = pathname.match(/^\/planos\/([^\/]+)(?:\/.*)?$/)
  const disciplineMatch = pathname.match(/^\/planos\/([^\/]+)\/([^\/]+)$/)

  if (!studyMatch) {
    return null
  }

  const studyId = studyMatch[1]
  const disciplineId = disciplineMatch?.[2]

  const studyQuery = useQuery(trpc.getStudy.queryOptions({ id: studyId }))
  const disciplineQuery = useQuery({
    ...trpc.getDiscipline.queryOptions({ disciplineId: disciplineId! }),
    enabled: !!disciplineId
  })

  const items: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/planos',
      icon: Home
    }
  ]

  if (studyQuery.data) {
    items.push({
      label: studyQuery.data.name,
      href: `/planos/${studyId}`,
      icon: null
    })
  }

  if (disciplineQuery.data) {
    items.push({
      label: disciplineQuery.data.name,
      href: null,
      icon: null
    })
  }

  if (items.length <= 1) {
    return null
  }

  return (
    <nav className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-foreground font-medium">
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}