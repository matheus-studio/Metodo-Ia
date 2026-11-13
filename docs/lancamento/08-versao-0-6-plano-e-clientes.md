# Versão 0.6.0 — do caderno ao plano de ação (13/11/2026)

## Por que mudou

O comprador abria o app e via um painel cheio de zeros, 15 telas e nenhuma
ordem. Era um caderno para anotar o que ele já estava fazendo, não uma
ferramenta para conseguir clientes.

## O que mudou

- **Hoje (tela inicial):** o comprador escolhe um dos 30 serviços e a cidade.
  O app mostra **uma ação por vez**, na ordem: deixar a mensagem pronta, responder
  quem respondeu, abordar a fila, achar mais negócios, dar retornos. Há uma
  faixa de 7 dias e contadores reais (fila, aguardando, responderam, proposta,
  fechados).
- **Clientes:** *Achar clientes* abre buscas prontas (Mapa, Google, Instagram)
  por tipo de negócio na cidade escolhida, com checklist de conferência, e salva
  o negócio na fila. *Minha lista* leva cada negócio da abordagem ao fechamento:
  mensagem pronta e editável, link do WhatsApp com o texto, retorno depois de 2
  dias, proposta e valor fechado (informado por quem usa).
- **Menu:** Hoje, Clientes, Serviços, Biblioteca e Mais. As telas antigas
  (Construtor, Ofertas, Prospecção, CRM completo, Projetos, Preços, IA Studio,
  Academia, Missões, Visão geral) continuam, em "Ferramentas avançadas".
- **Backup:** o plano agora vai junto no arquivo de backup.

## O que NÃO mudou (de propósito)

- Nenhum dado de empresa é inventado nem raspado: o app só abre buscas em fontes
  públicas e quem olha e decide é o usuário.
- Nenhuma mensagem é enviada pelo app: ele copia ou abre a conversa, e o envio é
  manual, uma por vez.
- "Não achei site" nunca vira "não tem site" (o app guarda o que foi conferido).
- As metas medem esforço, não resultado. Sem promessa de renda.

## Verificação (executada)

- 295 testes automatizados passando, tipos, lint e contraste ok, orçamento de
  carga ok (110,8 de 120 kB).
- Fluxo completo rodado num Chromium com tela de celular: criar o plano, preparar
  a mensagem, salvar um negócio, abordar com o link do WhatsApp, e ver o plano
  avançar. Sem erros no console.

## Não verificado

- Em aparelho Android e em Windows reais.
- Se alguém consegue o primeiro cliente seguindo o plano: depende do usuário, do
  serviço e do mercado. Não há dado para afirmar isso.
- O link de busca por Instagram usa o Google com `site:instagram.com`; o Google
  pode mudar o resultado ou pedir verificação.
