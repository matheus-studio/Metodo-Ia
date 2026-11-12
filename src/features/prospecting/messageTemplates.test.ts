import { describe, expect, it } from 'vitest'
import { buildMessage, sanitizePhone, whatsappLink } from './messageTemplates'

describe('buildMessage', () => {
  it('usa o nome do contato quando existe e fica neutro quando não existe', () => {
    expect(buildMessage('whatsapp', 'consultivo', { contactName: 'Ana' }).body).toContain('Ana')
    expect(buildMessage('whatsapp', 'consultivo', {}).body.startsWith('Olá! Tudo bem?')).toBe(true)
  })

  it('não inventa observação sobre o negócio quando nada foi informado', () => {
    const body = buildMessage('whatsapp', 'consultivo', { serviceName: 'criação de sites' }).body
    expect(body).not.toMatch(/não (tem|possui)/i)
    expect(body).not.toContain('{')
  })

  it('inclui a observação verificada e pede confirmação ao usuário', () => {
    const message = buildMessage('whatsapp', 'direto', {
      serviceName: 'criação de sites',
      verifiedObservation: 'Vi que o cardápio do perfil está em foto de 2023.',
    })
    expect(message.body).toContain('cardápio do perfil')
    expect(message.warnings.join(' ')).toContain('Confirme')
  })

  it('avisa quando o serviço não foi definido', () => {
    expect(buildMessage('whatsapp', 'direto', {}).warnings.join(' ')).toContain('serviço')
  })

  it('gera assunto apenas no e-mail', () => {
    const email = buildMessage('email', 'consultivo', { serviceName: 'criação de sites', companyName: 'Cantina' })
    expect(email.subject).toBe('criação de sites para Cantina')
    expect(buildMessage('whatsapp', 'consultivo', { serviceName: 'criação de sites' }).subject).toBeUndefined()
  })

  it('muda o texto conforme o tom', () => {
    const direto = buildMessage('whatsapp', 'direto', { serviceName: 'sites' }).body
    const informal = buildMessage('whatsapp', 'informal', { serviceName: 'sites' }).body
    expect(direto).not.toBe(informal)
    expect(informal.startsWith('Oi!')).toBe(true)
  })

  it('no follow-up cita os dias e a proposta em aberto', () => {
    const body = buildMessage('followup', 'consultivo', {
      serviceName: 'site institucional',
      daysSinceContact: 7,
      offerName: 'Presença digital',
    }).body
    expect(body).toContain('7 dia')
    expect(body).toContain('Presença digital')
  })

  it('responde objeção de preço com alternativas, sem insistir', () => {
    const body = buildMessage('objecao', 'consultivo', { objection: 'preco', serviceName: 'o site' }).body
    expect(body).toContain('escopo')
    expect(body).toContain('etapas')
  })

  it('aceita a recusa quando a objeção é falta de interesse', () => {
    const body = buildMessage('objecao', 'consultivo', { objection: 'sem-interesse' }).body
    expect(body).toContain('Não vou insistir')
  })

  it('avisa sobre limites de canal no LinkedIn e no Instagram', () => {
    expect(buildMessage('linkedin', 'direto', { serviceName: 'sites' }).warnings.join(' ')).toContain('LinkedIn')
    expect(buildMessage('instagram', 'direto', { serviceName: 'sites' }).warnings.join(' ')).toContain('Instagram')
  })
})

describe('telefone e link do WhatsApp', () => {
  it('normaliza número brasileiro acrescentando o código do país', () => {
    expect(sanitizePhone('(41) 99999-0000')).toBe('5541999990000')
  })

  it('mantém número que já veio com código do país', () => {
    expect(sanitizePhone('+55 41 99999-0000')).toBe('5541999990000')
  })

  it('recusa número curto ou longo demais', () => {
    expect(sanitizePhone('1234')).toBeNull()
    expect(sanitizePhone('1234567890123456789')).toBeNull()
  })

  it('monta o link com o texto codificado', () => {
    const link = whatsappLink('(41) 99999-0000', 'Olá! Tudo bem?')
    expect(link).toBe('https://wa.me/5541999990000?text=Ol%C3%A1!%20Tudo%20bem%3F')
  })

  it('não monta link para telefone implausível', () => {
    expect(whatsappLink('123', 'Olá')).toBeNull()
  })
})
