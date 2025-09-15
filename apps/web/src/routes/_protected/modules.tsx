import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/modules')({
  component: () => <div>Modules</div>,
})