import { moduleByKey } from '@/app/modules'
import type { AppModule } from '@/app/modules'
import type { UserPreferences } from '@/types/domain'
import type { WorkspaceSnapshot } from './snapshot'

/**
 * Motor de próximo passo.
 *
 * Regras locais e determinísticas sobre os dados que o próprio usuário criou —
 * nenhuma chamada a modelo de linguagem é necessária para isto, e o resultado é
 * auditável e testável. Cada recomendação diz *por que* apareceu (`reason`),
 * para não virar sugestão sem fundamento.
 */

export interface Recommendation {
  id: string
  title: string
  body: string
  reason: string
  moduleKey: string
  actionLabel: string
}

export interface ResolvedRecommendation extends Recommendation {
  module: AppModule | undefined
  /** Falso quando o módulo responsável ainda não foi entregue. */
  available: boolean
}

function rule(snapshot: WorkspaceSnapshot, preferences: UserPreferences): Recommendation {
  const { counts, dealsByStage, offersByStatus, overdueTasks } = snapshot

  if (!preferences.onboardingDone || preferences.skills.length === 0) {
    return {
      id: 'configurar-perfil',
      title: 'Configure seu perfil de trabalho',
      body: 'Informe suas habilidades e seu valor por hora. O painel passa a recomendar serviços compatíveis e a calculadora já parte do seu número.',
      reason: 'Seu perfil ainda não foi preenchido.',
      moduleKey: 'settings',
      actionLabel: 'Abrir configurações',
    }
  }

  if (overdueTasks.length > 0) {
    const first = overdueTasks[0]
    return {
      id: 'tarefa-atrasada',
      title: 'Você tem tarefa com prazo vencido',
      body: `"${first?.title ?? 'Tarefa'}" passou do prazo. Resolver atrasos antes de abrir frentes novas evita perder negociações em andamento.`,
      reason: `${overdueTasks.length} tarefa(s) com prazo vencido.`,
      moduleKey: 'projects',
      actionLabel: 'Ver tarefas',
    }
  }

  if (counts.opportunities === 0 && counts.blueprints === 0) {
    return {
      id: 'explorar-servicos',
      title: 'Escolha o primeiro serviço para oferecer',
      body: 'Comece pelo catálogo: cada serviço traz problema resolvido, entregáveis, ferramentas e tempo estimado, para você escolher com critério em vez de chutar.',
      reason: 'Nenhuma oportunidade ou serviço salvo até agora.',
      moduleKey: 'radar-servicos',
      actionLabel: 'Explorar serviços',
    }
  }

  if (counts.blueprints === 0) {
    return {
      id: 'estruturar-servico',
      title: 'Transforme a oportunidade em serviço estruturado',
      body: 'Você salvou oportunidades, mas ainda não definiu escopo e entregáveis. Sem isso, a proposta fica genérica e o preço vira palpite.',
      reason: `${counts.opportunities} oportunidade(s) salva(s) e nenhum serviço estruturado.`,
      moduleKey: 'service-builder',
      actionLabel: 'Construir serviço',
    }
  }

  if (counts.offers === 0) {
    return {
      id: 'criar-oferta',
      title: 'Monte a proposta comercial do seu serviço',
      body: 'Com o escopo pronto, a oferta é o próximo passo: problema, solução, entregáveis, prazo, preço e condições em um documento que você envia.',
      reason: 'Há serviço estruturado, mas nenhuma oferta criada.',
      moduleKey: 'offers',
      actionLabel: 'Criar oferta',
    }
  }

  if (counts.companies === 0 && counts.contacts === 0) {
    return {
      id: 'encontrar-empresas',
      title: 'Registre as empresas que você vai abordar',
      body: 'Cadastre quem você já conhece ou visitou, com o que você verificou sobre a presença digital de cada uma. A busca automática por fonte autorizada chega no Marco 3.',
      reason: 'Nenhuma empresa ou contato registrado.',
      moduleKey: 'crm',
      actionLabel: 'Cadastrar empresa',
    }
  }

  if (counts.deals === 0) {
    return {
      id: 'preparar-abordagem',
      title: 'Prepare a abordagem e registre a negociação',
      body: 'Você já tem oferta e empresas na lista. Escreva a mensagem, revise antes de enviar e registre a tentativa para não perder o acompanhamento.',
      reason: `${counts.companies + counts.contacts} registro(s) comercial(is) e nenhuma negociação aberta.`,
      moduleKey: 'prospecting',
      actionLabel: 'Preparar abordagem',
    }
  }

  if (dealsByStage.novo > 0) {
    return {
      id: 'abordar-novos',
      title: 'Faça o primeiro contato das negociações novas',
      body: 'Negociação parada no estágio "novo" não avança sozinha. Envie a abordagem e mova o estágio assim que houver retorno.',
      reason: `${dealsByStage.novo} negociação(ões) ainda sem contato.`,
      moduleKey: 'crm',
      actionLabel: 'Abrir CRM',
    }
  }

  if (dealsByStage.respondeu > 0 && offersByStatus.enviada === 0) {
    return {
      id: 'enviar-proposta',
      title: 'Envie a proposta para quem respondeu',
      body: 'Quem respondeu está no melhor momento para receber a proposta. Ajuste a oferta ao que foi conversado e registre o envio.',
      reason: `${dealsByStage.respondeu} contato(s) responderam e nenhuma proposta foi enviada.`,
      moduleKey: 'offers',
      actionLabel: 'Revisar ofertas',
    }
  }

  if (dealsByStage.proposta > 0 || dealsByStage.negociacao > 0) {
    return {
      id: 'follow-up',
      title: 'Faça o follow-up das propostas em aberto',
      body: 'Proposta enviada sem retorno costuma precisar de um segundo contato objetivo, com prazo e próximo passo claros.',
      reason: `${dealsByStage.proposta + dealsByStage.negociacao} negociação(ões) aguardando decisão.`,
      moduleKey: 'crm',
      actionLabel: 'Abrir CRM',
    }
  }

  if (dealsByStage.fechado > 0 && counts.projects === 0) {
    return {
      id: 'iniciar-projeto',
      title: 'Abra o projeto do serviço fechado',
      body: 'Venda fechada vira entrega: colete o briefing, defina as etapas e acompanhe até a aprovação do cliente.',
      reason: `${dealsByStage.fechado} negociação(ões) fechada(s) sem projeto aberto.`,
      moduleKey: 'projects',
      actionLabel: 'Abrir projetos',
    }
  }

  if (snapshot.openProjects > 0) {
    return {
      id: 'avancar-projeto',
      title: 'Avance o projeto em andamento',
      body: 'Entrega combinada é compromisso com data. Conclua as tarefas pendentes e registre a aprovação de cada entregável antes de dar o projeto por encerrado.',
      reason: `${snapshot.openProjects} projeto(s) ainda não entregue(s).`,
      moduleKey: 'projects',
      actionLabel: 'Abrir projetos',
    }
  }

  return {
    id: 'manter-ritmo',
    title: 'Mantenha o fluxo com novas oportunidades',
    body: 'Seu funil está em movimento. Enquanto as negociações atuais avançam, alimente a próxima leva de contatos para não ficar sem fila.',
    reason: 'Nenhum gargalo evidente nos seus registros atuais.',
    moduleKey: 'radar-servicos',
    actionLabel: 'Explorar serviços',
  }
}

export function nextStep(snapshot: WorkspaceSnapshot, preferences: UserPreferences): ResolvedRecommendation {
  const recommendation = rule(snapshot, preferences)
  const module = moduleByKey(recommendation.moduleKey)
  return { ...recommendation, module, available: module?.status === 'disponivel' }
}

/** Progresso da jornada: etapas concluídas com base nos registros reais. */
export interface JourneyStep {
  key: string
  label: string
  done: boolean
}

export function journey(snapshot: WorkspaceSnapshot): JourneyStep[] {
  const { counts, dealsByStage } = snapshot
  return [
    { key: 'oportunidade', label: 'Oportunidade escolhida', done: counts.opportunities > 0 || counts.blueprints > 0 },
    { key: 'servico', label: 'Serviço estruturado', done: counts.blueprints > 0 },
    { key: 'oferta', label: 'Oferta criada', done: counts.offers > 0 },
    { key: 'empresa', label: 'Empresa ou contato', done: counts.companies > 0 || counts.contacts > 0 },
    { key: 'abordagem', label: 'Abordagem registrada', done: counts.deals > dealsByStage.novo },
    { key: 'fechamento', label: 'Negociação fechada', done: dealsByStage.fechado > 0 },
    { key: 'entrega', label: 'Projeto em execução', done: counts.projects > 0 },
  ]
}
