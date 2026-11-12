import type { IconName } from '@/components/ui/Icon'

/**
 * Registro único dos módulos do produto.
 *
 * A navegação mostra apenas o que já está implementado — nenhum botão leva a
 * uma tela vazia. O roteiro (/roteiro) lê a mesma lista para mostrar o que
 * ainda vem, com o marco correspondente. Quando um módulo entra no ar, muda-se
 * `status` aqui e ele aparece na navegação automaticamente.
 */

export type ModuleStatus = 'disponivel' | 'marco-3'

export type ModuleGroup = 'operacao' | 'comercial' | 'execucao' | 'conhecimento' | 'sistema'

export interface AppModule {
  key: string
  label: string
  path: string
  icon: IconName
  group: ModuleGroup
  status: ModuleStatus
  summary: string
  /** Aparece na barra inferior do celular; o resto fica em "Mais". */
  primary?: boolean
}

export const GROUP_LABELS: Record<ModuleGroup, string> = {
  operacao: 'Operação',
  comercial: 'Comercial',
  execucao: 'Execução',
  conhecimento: 'Conhecimento',
  sistema: 'Sistema',
}

export const MODULES: readonly AppModule[] = [
  {
    key: 'dashboard',
    label: 'Painel',
    path: '/',
    icon: 'dashboard',
    group: 'operacao',
    status: 'disponivel',
    primary: true,
    summary: 'Centro da jornada: situação atual, próximo passo recomendado e atividade recente.',
  },
  {
    key: 'radar-servicos',
    label: 'Serviços',
    path: '/radar/servicos',
    icon: 'radar',
    group: 'comercial',
    status: 'disponivel',
    primary: true,
    summary: 'Catálogo com escopo, entregáveis, ferramentas, riscos e plano de execução de cada serviço.',
  },
  {
    key: 'service-builder',
    label: 'Construtor',
    path: '/servicos',
    icon: 'blueprint',
    group: 'comercial',
    status: 'disponivel',
    summary: 'Transforma uma ideia em serviço estruturado: escopo, etapas, prazo, riscos e checklist.',
  },
  {
    key: 'offers',
    label: 'Ofertas',
    path: '/ofertas',
    icon: 'offer',
    group: 'comercial',
    status: 'disponivel',
    summary: 'Proposta comercial editável, da dor do cliente ao próximo passo, pronta para copiar ou exportar.',
  },
  {
    key: 'prospecting',
    label: 'Prospecção',
    path: '/prospeccao',
    icon: 'message',
    group: 'comercial',
    status: 'disponivel',
    summary: 'Preparo de abordagens por canal, com revisão antes do envio. Sem disparo automático.',
  },
  {
    key: 'crm',
    label: 'CRM',
    path: '/crm',
    icon: 'pipeline',
    group: 'comercial',
    status: 'disponivel',
    primary: true,
    summary: 'Contatos, empresas e negociações do primeiro contato ao fechamento.',
  },
  {
    key: 'roadmap',
    label: 'Roteiro',
    path: '/roteiro',
    icon: 'map',
    group: 'operacao',
    status: 'disponivel',
    summary: 'O que já está pronto, o que vem a seguir e em qual marco cada módulo entra.',
  },
  {
    key: 'settings',
    label: 'Configurações',
    path: '/configuracoes',
    icon: 'settings',
    group: 'sistema',
    status: 'disponivel',
    summary: 'Perfil de trabalho, aparência, backup, restauração e limpeza dos dados locais.',
  },
  {
    key: 'radar-empresas',
    label: 'Encontrar Empresas',
    path: '/radar/empresas',
    icon: 'building',
    group: 'comercial',
    status: 'marco-3',
    summary: 'Busca de estabelecimentos reais por fonte autorizada, com classificação de presença digital.',
  },
  {
    key: 'projects',
    label: 'Projetos',
    path: '/projetos',
    icon: 'project',
    group: 'execucao',
    status: 'disponivel',
    summary: 'Briefing, planejamento, execução, revisão e entrega conectados à oferta aceita.',
  },
  {
    key: 'pricing',
    label: 'Preços',
    path: '/precificacao',
    icon: 'calculator',
    group: 'execucao',
    status: 'disponivel',
    summary: 'Cálculo transparente por hora, custos, revisões e margem — transferível para a oferta.',
  },
  {
    key: 'studio',
    label: 'IA Studio',
    path: '/studio',
    icon: 'spark',
    group: 'conhecimento',
    status: 'disponivel',
    summary: 'Construtor de prompts com papel, contexto, método, restrições e critérios de qualidade.',
  },
  {
    key: 'library',
    label: 'Biblioteca',
    path: '/biblioteca',
    icon: 'book',
    group: 'conhecimento',
    status: 'disponivel',
    primary: true,
    summary: 'Prompts, modelos, scripts e checklists detalhados por área de trabalho.',
  },
  {
    key: 'academy',
    label: 'Academia',
    path: '/academia',
    icon: 'academy',
    group: 'conhecimento',
    status: 'disponivel',
    summary: 'IA, marketing, vendas e prestação de serviços explicados com aplicação prática.',
  },
  {
    key: 'missions',
    label: 'Missões',
    path: '/missoes',
    icon: 'target',
    group: 'execucao',
    status: 'disponivel',
    summary: 'Metas, tarefas e planejamento semanal para manter a execução em movimento.',
  },
] as const

export const AVAILABLE_MODULES = MODULES.filter((module) => module.status === 'disponivel')

export const PRIMARY_MODULES = AVAILABLE_MODULES.filter((module) => module.primary)

export const SECONDARY_MODULES = AVAILABLE_MODULES.filter((module) => !module.primary)

export function moduleByKey(key: string): AppModule | undefined {
  return MODULES.find((module) => module.key === key)
}

export function availableByGroup(): { group: ModuleGroup; modules: AppModule[] }[] {
  const order: ModuleGroup[] = ['operacao', 'comercial', 'execucao', 'conhecimento', 'sistema']
  return order
    .map((group) => ({ group, modules: AVAILABLE_MODULES.filter((module) => module.group === group) }))
    .filter((entry) => entry.modules.length > 0)
}

export const MILESTONE_LABELS: Record<Exclude<ModuleStatus, 'disponivel'>, string> = {
  'marco-3': 'Marco 3 — Radar de empresas reais',
}
