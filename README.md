# Método IA Pro

**Da oportunidade à execução.** Plataforma para encontrar a oportunidade comercial, estruturar o serviço, propor, negociar e entregar — com apoio de IA onde ela realmente ajuda.

> **Release candidate v0.5.0** — verificada em 13/11/2026: 266 testes passando, build publicável, orçamento de carga e contraste dentro dos limites, `npm audit` sem vulnerabilidades, e **LCP, INP e CLS medidos em navegador real** (números em `docs/qualidade.md`). A tabela de estado de cada funcionalidade (concluída, pendente de integração, planejada) está no mesmo documento.

> **Para vender:** comece por `docs/lancamento/00-leia-primeiro.md` (estado por plataforma, ordem dos passos, entrega, texto de venda, guia do comprador e termos).
>
> Duas frentes dependem de decisão externa ao código e **não** estão implementadas: o **Radar de empresas reais** (`docs/radar.md`) e **contas e pagamentos** (`docs/comercial.md`).

## Como executar

Requer Node.js 20.19+ (desenvolvido em Node 22).

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:5173
npm run build      # verificação de tipos + build de produção em dist/
npm run preview    # serve o build de produção
npm test           # suíte de testes (Vitest)
npm run coverage   # testes com relatório de cobertura
npm run lint       # oxlint
npm run typecheck  # apenas verificação de tipos
npm run budget     # orçamento de carga sobre o dist/ (exige build antes)
npm run contrast   # contraste dos tokens nos dois temas (WCAG 2.2 AA)
npm run qualidade  # tudo acima, na ordem
npm run build:app  # build com rota no fragmento (GitHub Pages, WebView/Capacitor)
```

## O que já funciona

- **Painel** — contagens reais dos seus registros, funil por estágio, ritmo semanal, tarefas abertas, atividade recente e, no topo, o **próximo passo recomendado** com o motivo pelo qual ele apareceu.
- **Explorar Serviços** — catálogo de 30 serviços com problema resolvido, público, entregáveis, ferramentas, habilidades, esforço estimado, modelos de cobrança, riscos, plano de execução e abordagem sugerida. Mais uma análise de adequação ao seu perfil.
- **Construtor de Serviços** — transforma a ideia em escopo: entregáveis, etapas, ferramentas, riscos e tempo. Pré-preenchido quando parte do catálogo.
- **Gerador de Ofertas** — proposta completa e editável, com aviso dos pontos que fragilizam a negociação, pré-visualização, cópia, exportação em arquivo e duplicação.
- **Prospecção** — rascunho de abordagem por canal (WhatsApp, Instagram, LinkedIn, e-mail, follow-up e resposta a objeção) e tom, com revisão antes do envio, link de conversa do WhatsApp e registro da tentativa no CRM.
- **CRM** — negociações em sete estágios, contatos e empresas, com busca, resumo do funil e cadastro manual de empresas com classificação honesta de presença digital.
- **Projetos** — briefing por modelo, tarefas, entregáveis com registro de aprovação e cinco estágios, da coleta de material à entrega. Projeto aberto a partir da negociação fechada já nasce com os entregáveis da oferta e as etapas do serviço como tarefas.
- **Calculadora de Preços** — parte das suas horas e dos seus custos, mostra cada linha da conta, embute imposto corretamente e transfere o valor para a oferta.
- **IA Studio** — construtor de prompts com papel, contexto, objetivo, entradas, método, restrições, critérios, formato e revisão; variáveis `{{assim}}`, revisor estrutural local, coleção de prompts salvos, cópia e exportação.
- **Biblioteca** — 41 materiais completos: prompts estruturados que abrem direto no Studio, checklists de publicação e de encerramento, roteiros de ligação e follow-up, modelos de proposta e de combinado de escopo.
- **Academia** — 17 aulas em quatro trilhas (IA, marketing, vendas, prestação de serviços) e 24 termos de glossário, cada aula com exemplo, erros comuns e link para o módulo onde aquilo é aplicado. Termos técnicos têm **ajuda contextual** dentro das telas de CRM, ofertas, preços, projetos, Studio e prospecção.
- **Missões** — ritmo semanal medido pelo registro real de atividade, com planejamento pessoal da semana. Sem pontos, sem medalhas, sem nível.
- **Roteiro** — mapa de todos os módulos e o marco de cada um.
- **Configurações** — perfil de trabalho, tema claro/escuro/sistema, exportação e restauração de backup, dados de demonstração sinalizados e exclusão total com confirmação.
- **Base técnica** — IndexedDB atrás de uma camada de repositórios, rotas com *code splitting*, design system em tokens, navegação de celular e de desktop, limite de erro, pré-carregamento de rota por intenção e 266 testes automatizados.

### Sem página de apresentação

O endereço raiz (`/`) **é o aplicativo**. Não existe página de venda na frente dele: quem abre o endereço cai no painel. Quem chega pela primeira vez é orientado dentro do próprio painel — o texto de abertura diz o que já vem pronto e desaparece assim que houver o primeiro registro. Material comercial, quando existir, mora fora do produto (ver `docs/comercial.md`).

## A jornada, ligada de ponta a ponta

```
catálogo → oportunidade → serviço estruturado → preço → oferta → abordagem
        → negociação no CRM → projeto → briefing → tarefas → entrega aprovada → painel
```

Cada passo pré-preenche o seguinte. Nada precisa ser digitado duas vezes — e nada é decidido por você: preço, prazo e revisões ficam em branco de propósito, porque são suas decisões.

## Princípios que o código respeita

1. **Nada de dado inventado.** Nenhuma tela exibe empresa, número ou resultado financeiro que o usuário não tenha criado. Os dados de demonstração são opcionais, explicitamente fictícios e sinalizados no painel enquanto estiverem ativos.
2. **Nenhum botão sem destino.** A navegação só mostra módulos entregues; o restante aparece no roteiro, com o marco correspondente.
3. **Recomendação com motivo.** O "próximo passo" vem de regras locais determinísticas sobre os seus registros — não de um palpite, não de uma chamada a modelo de linguagem.
4. **Dados são seus e locais.** Sem conta, sem servidor, sem telemetria nesta fase. O backup é a forma de levar os dados para outro dispositivo — e, se o navegador não estiver gravando no aparelho, o aplicativo avisa em vez de dizer "salvo".
5. **Restauração é tudo ou nada.** O backup é validado inteiro antes de qualquer gravação, e a escrita acontece em uma transação só: falha no meio não deixa metade dos dados.
6. **Presença digital não se presume.** O modelo de domínio distingue "site não cadastrado na fonte" de "empresa não tem site" — e o produto nunca tratará o primeiro como se fosse o segundo.
7. **Sem spam.** A prospecção prepara uma mensagem por vez, para você revisar e enviar. Não há disparo automático nem envio em massa, e não haverá.
8. **O que não dá para calcular, não se calcula.** Sem pontuação de demanda, sem previsão de receita ponderada, sem preço de mercado sugerido. O que existe é soma do que você informou, com a contagem do que ficou em branco.
9. **IA é ferramenta, não enfeite.** O IA Studio monta e revisa prompts com regras locais e diz na tela que não está conectado a nenhum modelo. Integração futura, se houver, mantém a credencial no servidor.
10. **Progresso é o que está feito.** A barra do projeto conta tarefas e entregáveis concluídos, não o estágio em que você o colocou — e a entrega fica bloqueada enquanto houver entregável sem aprovação registrada.

## Estrutura

```
src/
  app/          rotas, providers, registro de módulos (modules.ts)
  brand/        marca e logo
  components/   primitivas de interface sem domínio
  design/       tokens, base, movimento, primitivas e padrões CSS compartilhados
  features/     um diretório por módulo (dashboard, roadmap, settings…)
  hooks/        hooks compartilhados
  repositories/ ponto único de acesso a dados
  services/     orquestração entre módulos
  storage/      IndexedDB, preferências, backup
  types/        modelo de domínio
  tests/        configuração e testes de integração de interface
  integrations/ contratos de integração futura (cobrança)
docs/           arquitetura, design system, qualidade, deploy e evolução comercial
server/         vazio de propósito — contrato do que vai existir quando houver servidor
```

## Documentação

- `docs/radar.md` — comparativo das fontes de dados de empresas (OpenStreetMap, Google Places, base de CNPJ), licenças, custos e infraestrutura mínima.
- `docs/deploy.md` — publicação em hospedagem estática, reescrita de rotas, cabeçalhos e CSP, e o caminho para Android/iOS com Capacitor.
- `docs/comercial.md` — arquitetura de contas, pagamentos, entrega de produto digital e migração do armazenamento local para remoto. Nada implementado, e o porquê.
- `docs/qualidade.md` — resultados medidos de testes, desempenho, acessibilidade, segurança e responsividade, e a lista do que não foi possível medir aqui.
- `docs/arquitetura.md` — decisões técnicas, camadas, desempenho, segurança e a posição sobre fontes de dados do Radar.
- `docs/design-system.md` — conceito visual, cor, tipografia, movimento, marca e acessibilidade.
