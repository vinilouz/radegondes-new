UserFlow:
  - old/frontend/src/pages/user/Planos.jsx (listagem de planos)
  - old/frontend/src/pages/user/PlanoDetalhes.jsx (detalhes do plano, com disciplinas)
  - old/frontend/src/pages/user/DisciplinaDetalhes.jsx (detalhes da disciplina, com tópicos)

Minha descrição personalizada

tasks:
* disciplinas
* topico
~ tempo
  - visualizar totais (topico, disciplina, estudo)
  - garantir tempo pt-br
- header
- breadcrumb
- aperfeiçoamentos
- mobile



defina responsabilidades (front,back,design,outro) e usando multi agents faça:
- padronize o header de todas paginas adaptando o @__OLD/frontend/src/components/Breadcrumb.jsx antigo e criando um atual que faça sentido no projeto atual, siga a estrutura: 
row 1: braeadcrumb 
row 2: title & description | back btn
row 3: specific content
for:
@apps/web/src/routes/_protected/planos/$studyId/$disciplineId.tsx
@apps/web/src/routes/_protected/planos/$studyId/index.tsx
@apps/web/src/routes/_protected/planos/index.tsx

- fix: studyTimerStore.ts:38 Uncaught (in promise) TypeError: randomUUID is not a function
    at Object.startSession (studyTimerStore.ts:38:23)