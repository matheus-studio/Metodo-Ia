/**
 * Modelos de briefing.
 *
 * As perguntas foram escolhidas por um critério só: cada uma evita um
 * retrabalho conhecido. Pergunta que não muda nada na execução foi deixada de
 * fora — briefing longo demais não é respondido.
 */

export interface BriefingTemplate {
  key: string
  label: string
  description: string
  questions: string[]
}

export const BRIEFING_TEMPLATES: readonly BriefingTemplate[] = [
  {
    key: 'geral',
    label: 'Geral',
    description: 'Serve para qualquer serviço. Use quando nenhum modelo específico se encaixar.',
    questions: [
      'O que precisa estar pronto, e até quando?',
      'Qual resultado o cliente espera ver no fim?',
      'Quem aprova a entrega, e quem mais opina?',
      'Que materiais o cliente vai enviar, e quando?',
      'O que está fora do escopo deste trabalho?',
      'Há alguma restrição de marca, linguagem ou obrigação legal?',
    ],
  },
  {
    key: 'site',
    label: 'Site ou landing page',
    description: 'Site institucional, página de conversão, cardápio ou catálogo.',
    questions: [
      'Qual é a ação principal que o visitante deve tomar?',
      'Quais seções o site precisa ter?',
      'Quem fornece textos, fotos e logo? Em que formato e até quando?',
      'Já existe domínio e hospedagem? Quem paga e quem tem o acesso?',
      'Há site ou página atual que será substituída? O que deve ser preservado?',
      'Quais contatos aparecem no site (telefone, WhatsApp, endereço, redes)?',
      'Quem vai atualizar o site depois da entrega?',
    ],
  },
  {
    key: 'redes',
    label: 'Conteúdo para redes sociais',
    description: 'Pacote mensal, planejamento ou campanha pontual.',
    questions: [
      'Quantas peças por período, e em quais formatos?',
      'Qual o objetivo do período: vender algo específico, divulgar, atrair currículo?',
      'Quem envia fotos e informações de produto, e com que antecedência?',
      'Quem aprova as peças, e em quanto tempo?',
      'Quem publica: você ou o cliente?',
      'Existe manual de marca, paleta ou tom de voz definido?',
      'Há assuntos proibidos ou que exigem cuidado (preço, saúde, promessas)?',
    ],
  },
  {
    key: 'video',
    label: 'Vídeo',
    description: 'Roteiro, gravação própria do cliente ou edição de material bruto.',
    questions: [
      'Quantos vídeos, com que duração e para qual formato?',
      'Quem grava, com que equipamento e em que local?',
      'Como o material bruto será enviado, e qual o prazo?',
      'O vídeo leva legenda, trilha e identidade visual?',
      'Há trilha ou imagem de terceiros envolvida? A licença está resolvida?',
      'Quantas rodadas de ajuste estão incluídas?',
    ],
  },
  {
    key: 'marca',
    label: 'Marca e material gráfico',
    description: 'Identidade visual, apresentação, material impresso.',
    questions: [
      'O que o negócio faz, e o que o diferencia de quem está ao lado?',
      'Que referências visuais o cliente gosta — e quais ele rejeita?',
      'Quais aplicações a marca precisa ter (fachada, embalagem, redes, impresso)?',
      'Haverá impressão? Quem contrata a gráfica e paga por ela?',
      'Quantas propostas e quantas revisões estão incluídas?',
      'Quem é a palavra final na aprovação?',
    ],
  },
  {
    key: 'operacao',
    label: 'Operação e automação',
    description: 'Planilhas, processos documentados, automações e atendimento.',
    questions: [
      'Qual processo exatamente será organizado, do início ao fim?',
      'Quem executa esse processo hoje, e como?',
      'Quais ferramentas e acessos serão necessários? Quem paga as assinaturas?',
      'Que decisão o cliente precisa tomar com os números ou com o processo?',
      'Quem será treinado, e quando?',
      'O que acontece se a ferramenta de origem mudar ou sair do ar?',
    ],
  },
] as const

export function briefingTemplate(key: string | undefined): BriefingTemplate | undefined {
  return BRIEFING_TEMPLATES.find((template) => template.key === key)
}
