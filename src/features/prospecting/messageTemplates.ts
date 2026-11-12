/**
 * Preparo de abordagens.
 *
 * Três regras governam este módulo:
 * 1. Uma frase só entra na mensagem se o dado que a sustenta existir. Nada de
 *    "vi que vocês não têm site" quando isso não foi verificado.
 * 2. O texto é sempre um rascunho editável. Nenhuma função daqui envia nada.
 * 3. Nenhum envio em massa: a saída é uma mensagem, para um destinatário.
 */

export type Channel = 'whatsapp' | 'instagram' | 'linkedin' | 'email' | 'followup' | 'objecao'
export type Tone = 'direto' | 'consultivo' | 'informal'

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  email: 'E-mail',
  followup: 'Follow-up',
  objecao: 'Resposta a objeção',
}

export const TONE_LABELS: Record<Tone, string> = {
  direto: 'Direto',
  consultivo: 'Consultivo',
  informal: 'Informal',
}

export type ObjectionKey = 'preco' | 'tempo' | 'pensar' | 'tem-alguem' | 'sem-interesse'

export const OBJECTION_LABELS: Record<ObjectionKey, string> = {
  preco: 'Achei caro',
  tempo: 'Agora não é o momento',
  pensar: 'Vou pensar e te retorno',
  'tem-alguem': 'Já tenho quem faz isso',
  'sem-interesse': 'Não tenho interesse',
}

export interface MessageContext {
  /** Como você se apresenta. */
  senderName?: string
  /** Nome do contato, se você souber. Sem isso, a saudação fica neutra. */
  contactName?: string
  companyName?: string
  /** O que você faz, em uma expressão curta: "criação de sites". */
  serviceName?: string
  /** Benefício concreto do serviço, na linguagem do cliente. */
  benefit?: string
  /** Observação verificada sobre o negócio — só use o que você confirmou. */
  verifiedObservation?: string
  offerName?: string
  objection?: ObjectionKey
  /** Dias desde o último contato, para o follow-up. */
  daysSinceContact?: number
}

export interface DraftMessage {
  subject?: string
  body: string
  /** Avisos para o usuário revisar antes de enviar. */
  warnings: string[]
}

function greeting(tone: Tone, contactName?: string): string {
  const name = contactName?.trim()
  if (tone === 'informal') return name ? `Oi, ${name}! Tudo bem?` : 'Oi! Tudo bem?'
  if (tone === 'direto') return name ? `Olá, ${name}.` : 'Olá.'
  return name ? `Olá, ${name}! Tudo bem?` : 'Olá! Tudo bem?'
}

function presentation(tone: Tone, context: MessageContext): string {
  const service = context.serviceName?.trim() || 'serviços digitais para negócios locais'
  const sender = context.senderName?.trim()
  const who = sender ? `Sou ${sender} e trabalho` : 'Trabalho'
  if (tone === 'direto') return `${who} com ${service}.`
  if (tone === 'informal') return `${who} com ${service} aqui na região.`
  return `${who} com ${service} e acompanho negócios parecidos com o de vocês.`
}

function closing(tone: Tone, channel: Channel): string {
  if (channel === 'email') {
    return tone === 'direto'
      ? 'Se fizer sentido, respondo com uma proposta objetiva. Podemos conversar esta semana?'
      : 'Se achar que faz sentido, posso te mostrar como ficaria no caso de vocês. Qual o melhor dia para uma conversa rápida?'
  }
  if (tone === 'direto') return 'Posso te enviar uma proposta objetiva?'
  if (tone === 'informal') return 'Se quiser, te mando um exemplo rápido. Pode ser?'
  return 'Posso te explicar em dois minutos como isso funcionaria aí?'
}

function objectionReply(objection: ObjectionKey, context: MessageContext): string {
  const service = context.serviceName?.trim() || 'o serviço'
  switch (objection) {
    case 'preco':
      return [
        'Entendo — e prefiro que o preço faça sentido a fechar de qualquer jeito.',
        `Posso fazer duas coisas: reduzir o escopo de ${service} para o que resolve primeiro, ou dividir a entrega em etapas, pagando por etapa.`,
        'Qual das duas se encaixa melhor no seu momento?',
      ].join(' ')
    case 'tempo':
      return [
        'Sem problema. Posso te procurar de novo quando for melhor.',
        'Qual mês faz mais sentido para a gente retomar? Deixo anotado e te chamo nessa época, sem insistir até lá.',
      ].join(' ')
    case 'pensar':
      return [
        'Combinado. Para você decidir com tudo em mãos, deixo o escopo e o prazo por escrito.',
        'Posso te retornar na próxima semana para saber o que achou?',
      ].join(' ')
    case 'tem-alguem':
      return [
        'Que bom que já tem alguém cuidando disso — isso facilita.',
        'Se em algum momento precisar de apoio pontual ou de uma segunda opinião, fico à disposição. Posso deixar meu contato salvo?',
      ].join(' ')
    case 'sem-interesse':
      return [
        'Tudo bem, obrigado pela sinceridade. Não vou insistir.',
        'Se precisar no futuro, é só me chamar. Bom trabalho aí!',
      ].join(' ')
  }
}

export function buildMessage(channel: Channel, tone: Tone, context: MessageContext): DraftMessage {
  const warnings: string[] = []
  const parts: string[] = []

  if (context.verifiedObservation?.trim()) {
    warnings.push('Confirme que a observação sobre o negócio é verdadeira antes de enviar.')
  }
  if (!context.serviceName?.trim()) {
    warnings.push('Defina o serviço que você oferece — a mensagem fica genérica sem isso.')
  }

  if (channel === 'objecao') {
    const objection = context.objection ?? 'pensar'
    parts.push(greeting(tone, context.contactName), objectionReply(objection, context))
    return { body: parts.join('\n\n'), warnings }
  }

  if (channel === 'followup') {
    const days = context.daysSinceContact
    parts.push(greeting(tone, context.contactName))
    parts.push(
      days !== undefined && days > 0
        ? `Passando para retomar nossa conversa de ${days} dia(s) atrás sobre ${context.serviceName?.trim() || 'o serviço'}.`
        : `Passando para retomar nossa conversa sobre ${context.serviceName?.trim() || 'o serviço'}.`,
    )
    if (context.offerName?.trim()) {
      parts.push(`A proposta "${context.offerName.trim()}" continua válida e posso ajustar o que for preciso.`)
    }
    parts.push(
      tone === 'direto'
        ? 'Faz sentido seguir, ou prefere que eu te procure mais para a frente?'
        : 'Quer que eu siga com ela, ou prefere que eu te procure em outro momento?',
    )
    return { body: parts.join('\n\n'), warnings }
  }

  parts.push(greeting(tone, context.contactName))
  parts.push(presentation(tone, context))

  if (context.verifiedObservation?.trim()) {
    parts.push(context.verifiedObservation.trim())
  }

  if (context.benefit?.trim()) {
    parts.push(
      tone === 'direto'
        ? `O resultado prático é: ${context.benefit.trim()}.`
        : `A ideia é simples: ${context.benefit.trim()}.`,
    )
  }

  parts.push(closing(tone, channel))

  if (channel === 'instagram') {
    warnings.push('No Instagram, mensagem de perfil desconhecido costuma cair em solicitações. Seja breve.')
  }
  if (channel === 'linkedin') {
    warnings.push('No LinkedIn, convites com texto longo têm limite de caracteres — confira antes de enviar.')
  }

  const message: DraftMessage = { body: parts.join('\n\n'), warnings }

  if (channel === 'email') {
    const company = context.companyName?.trim()
    message.subject = context.serviceName?.trim()
      ? `${context.serviceName.trim()}${company ? ` para ${company}` : ''}`
      : 'Proposta de trabalho'
  }

  return message
}

/* ------------------------------------------------------------- WhatsApp */

/** Mantém apenas dígitos e valida um comprimento plausível de telefone. */
export function sanitizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return null
  // Número brasileiro sem código do país recebe o 55.
  if (digits.length <= 11) return `55${digits}`
  return digits
}

/**
 * Monta o link de conversa do WhatsApp com texto pré-preenchido. O envio
 * continua manual: o aplicativo abre a conversa, quem aperta "enviar" é o
 * usuário. Retorna null quando o telefone não é plausível — melhor não abrir
 * nada do que abrir uma conversa errada.
 */
export function whatsappLink(phone: string, text: string): string | null {
  const number = sanitizePhone(phone)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
