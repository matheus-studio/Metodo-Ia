# Qualidade — release candidate v0.5.0

Tudo nesta página foi **executado em 16/10/2026**, no código desta entrega.
Reproduza o essencial com um comando: `npm run qualidade` (typecheck → lint →
testes → build → orçamento → contraste). As métricas de campo (LCP, INP, CLS)
foram medidas à parte, em Chromium real — ver seção 4.

## 1. Estado das funcionalidades

| Módulo | Estado | Observação |
| --- | --- | --- |
| Painel | Concluído | Contagens, funil, ritmo semanal e próximo passo com motivo |
| Catálogo de serviços (30) | Concluído | Filtros por categoria, complexidade e segmento; análise de adequação |
| Construtor de serviços | Concluído | Pré-preenchido a partir do catálogo |
| Gerador de ofertas | Concluído | Aviso de pontos frágeis, pré-visualização, cópia, exportação, duplicação |
| Prospecção | Concluído | 6 canais, 3 tons, link de WhatsApp validado, registro no CRM |
| CRM (negociações, contatos, empresas) | Concluído | 7 estágios, busca, resumo do funil, cadastro manual de empresas |
| Projetos e briefings | Concluído | 6 modelos de briefing, tarefas, entregáveis com aprovação, 5 estágios |
| Precificação | Concluído | Horas invisíveis incluídas, imposto embutido, transferência para a oferta |
| IA Studio | Concluído, sem IA conectada | Composição e revisão por regras locais; a tela declara isso |
| Biblioteca (41 materiais) | Concluído | Prompts abrem no Studio; checklists, roteiros e modelos completos |
| Academia (17 aulas, 24 termos) | Concluído | Ajuda contextual embutida nas telas de CRM, ofertas, preços, projetos, Studio e prospecção |
| Missões | Concluído | Progresso vindo do histórico real de atividade |
| Configurações e backup | Concluído | Exportação, restauração atômica (mesclar/substituir), demonstração sinalizada, exclusão com confirmação |
| Entrada no aplicativo | Concluído | A raiz (`/`) é o painel; não há página de apresentação. Orientação de primeiro acesso dentro do painel |
| Roteiro | Concluído | Lê o mesmo registro de módulos da navegação |
| **Radar de empresas reais** | **Integração pendente** | Contratos e isolamento prontos; falta fonte + servidor (`docs/radar.md`) |
| **Contas e pagamentos** | **Planejado** | Contratos de tipo escritos; nenhuma integração (`docs/comercial.md`) |
| **Sincronização entre aparelhos** | **Planejado** | Depende de conta e servidor; hoje o caminho é o backup |
| **Aplicativo nas lojas** | **Planejado** | Configuração do Capacitor pronta; falta máquina com Android Studio/Xcode |
| Service worker / uso offline | Planejado | Manifest existe; sem cache offline por falta de navegador para testar |

## 2. Testes automatizados

```
30 arquivos · 266 testes · 266 passando (13/11/2026)
```

| Área | O que é verificado |
| --- | --- |
| Regras puras | Próximo passo, filtros e adequação do catálogo, documento da oferta, mensagens de prospecção, funil, precificação, progresso e bloqueios de projeto, prompts, missões, contagens de conteúdo |
| Persistência | Repositório sobre IndexedDB real (`fake-indexeddb`), fallback em memória, preferências, migração v1→v2, ciclo criar/editar/excluir/reabrir |
| Backup | Validação por coleção, recusa de arquivo inválido, **atomicidade com falha no meio** (IndexedDB e fallback) |
| Interface | Jornada completa, execução, conhecimento, configurações, entrada do aplicativo, avisos de armazenamento |
| Segurança | Varredura do código, entrada hostil, CSP, saneamento de URL |
| Acessibilidade | axe-core em 22 rotas |
| Integrações | Cobrança e Radar recusam operação em vez de simular |

## 3. Correções desta rodada (v0.5.0 — interface e identidade)

| Problema | Correção | Como foi verificado |
| --- | --- | --- |
| **Telas renderizando sem parte do estilo.** O CSS é dividido por rota, e 30 classes usadas por várias telas estavam declaradas no arquivo de uma única funcionalidade: `.chip` vivia em `settings.css` e era usada por catálogo, biblioteca, CRM e prospecção; `.crm__tabs` era usada pela academia; `.page-intro` (ex-`services__intro`) era usada por treze telas. Nessas rotas os elementos apareciam sem pílula, sem borda e sem espaçamento | Padrões compartilhados movidos para `src/design/patterns.css`, que entra no CSS de entrada e é sempre carregado | Captura de tela em Chromium real, antes e depois, nas rotas afetadas. CSS de entrada subiu 0,9 kB comprimido (5,7 → 6,6, teto 12) e o total publicado caiu |
| Rótulo da seção repetido: a barra superior já mostra "Painel" e a página repetia "Painel" logo abaixo do título — em catorze telas | Linha de contexto removida onde ela só repetia o rótulo; mantida onde informa algo novo (estágio, tipo de registro, "Nova oferta") | Captura de tela em todas as rotas |
| Caixa alta espaçada em rótulos e indicadores | Rótulos em caixa baixa; hierarquia feita por tamanho, peso e tinta | `npm run contrast` e captura de tela |
| Texto de apoio abaixo do mínimo de contraste para texto normal (3,45:1 no escuro, 3,70:1 no claro) | `--text-muted` elevado nos dois temas; o secundário do tema claro subiu junto para o degrau não sumir | `npm run contrast` passou a cobrar 4,5:1 desse par: agora 4,88:1 (escuro) e 4,80:1 (claro) |
| Pré-carregamento de rota era a interação mais lenta do aplicativo (88 ms): o `import()` rodava dentro do próprio `pointerenter`, antes da pintura seguinte | Importação adiada para o tempo ocioso (`requestIdleCallback`) | Medição de Event Timing em Chromium, antes e depois |
| "1 módulos planejados" no trilho lateral | Singular e plural corretos | Captura de tela |

### Correções da rodada anterior (v0.4.0)

| Problema | Correção | Teste de regressão |
| --- | --- | --- |
| Script inline do tema incompatível com `script-src 'self'` | Inicialização movida para `public/theme-init.js`, carregada com `%BASE_URL%`. CSP mantida sem `unsafe-inline` e replicada no Vercel | `security.test.tsx` |
| Restauração de backup podia deixar dados pela metade | Validação integral antes de gravar + gravação em **uma transação**; no fallback em memória, retrato e recolocação em caso de erro | `backup.test.ts`, `fallback.test.ts` |
| Importação aceitava registros malformados silenciosamente | Validação por coleção; arquivo inválido é recusado inteiro | `backup.test.ts`: 4 casos |
| Dados podiam ficar só em memória sem o usuário saber | Estado de armazenamento observável, faixa de aviso e mensagem de importação que distingue gravação atômica de volátil | `persistence.test.tsx`: 5 casos |
| Telefone pré-preenchido na prospecção não podia ser apagado | Campo distingue "não editado" de "apagado de propósito" | `journey.test.tsx` |
| Link em Missões recarregava o aplicativo inteiro | Trocado por link de roteador | — |
| Documentação com 237 e 221 testes ao mesmo tempo | Números e data unificados a partir da execução real | — |

## 4. Desempenho

### 4.1 Métricas de campo, medidas em navegador real

Chromium 1194 (headless), servindo o `dist/` desta entrega por `vite preview`.
Três execuções por perfil; o que está abaixo é a faixa observada.

| | Desktop, sem limitação | Celular modesto (CPU 4× mais lenta, 4G lento: 1,6 Mb/s, 150 ms de latência) | Meta |
| --- | --- | --- | --- |
| FCP | 164–192 ms | 1 272–1 308 ms | — |
| **LCP** | 700–740 ms | **1 668–1 708 ms** | < 2 500 ms ✅ |
| **CLS** | 0,0000–0,0055 | 0,0000 | < 0,1 ✅ |
| **Pior interação** (Event Timing) | 64–96 ms | 64–96 ms | INP < 200 ms ✅ |

O roteiro medido em cada execução: abrir a raiz, trocar o tema duas vezes,
navegar para o catálogo, digitar na busca e aplicar um filtro.

**O que estes números não são.** Não são dados de campo: é um navegador sem
extensões, em container, servindo de `localhost`, com rede e CPU *emulados*.
INP de verdade é um percentil do uso real de muitas pessoas; aqui está a pior
interação de um roteiro roteirizado — um limite superior razoável para esse
roteiro, não a experiência de um usuário num Android de entrada. Também não há
Lighthouse nem medição em aparelho físico (ver seção 8).

### 4.2 Orçamento de carga

`npm run budget`, medido sobre o `dist/` real:

```
  ok   Primeiro carregamento (painel)        110,5 / 120 kB comprimidos (subiu ~6 kB: backup nativo do Android e instalação do PWA)
  ok   Maior chunk de rota (libraryData)      22,1 /  30 kB comprimidos
  ok   CSS de entrada                          6,6 /  12 kB comprimidos

Total publicado: 541,8 kB comprimidos em 67 arquivos
```

Composição do primeiro acesso: vendor 79,5 · entrada 10,4 · CSS base 6,6 ·
painel 5,2+1,0 · HTML 0,6 · runtime, hooks e barramento 0,9 · script de tema 0,5.

**O "total publicado" não é o que o usuário baixa.** Boa parte são as 11 fontes
`woff2`, servidas por `unicode-range`: quem lê em português baixa apenas os
subconjuntos latinos. O conteúdo (catálogo, biblioteca, academia) só desce para
quem abre aquelas telas.

Mudanças desta rodada: a saída da landing tirou um chunk de rota e 5 kB do total
publicado; os padrões compartilhados de CSS somaram 0,9 kB ao arquivo de
entrada, que agora carrega correto em todas as rotas; e o pré-carregamento por
intenção deixou de rodar dentro do evento de ponteiro.

## 5. Segurança

`npm audit`: **0 vulnerabilidades**, com e sem dependências de desenvolvimento.

Varredura automatizada do código-fonte (falha o teste se reaparecer): nenhum
`dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML =` ou
`document.write`; todo `target="_blank"` com `rel="noopener"`; nenhum padrão de
credencial embutida; nenhum script inline no `index.html`.

Comportamento com entrada hostil, verificado por teste: marcação HTML gravada
como nome de empresa aparece escapada; `javascript:` em campo de site não vira
link clicável (`safeExternalUrl`); `localStorage` adulterado não derruba o app;
backup com coleção desconhecida ou `__proto__` é ignorado; arquivo acima do
limite é recusado antes de processar.

Cabeçalhos publicados (Netlify e Vercel, agora idênticos): CSP com
`script-src 'self'` — sem `unsafe-inline` —, `nosniff`, `frame-ancestors 'none'`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` desligando câmera, microfone e localização, e cache
imutável em `/assets/*`.

`style-src` mantém `'unsafe-inline'` porque medidores e barras de progresso
passam valores por variável CSS inline. É uma concessão conhecida e de risco
baixo; remover exigiria reescrever esses componentes com classes pré-definidas.

**Pendente antes de qualquer versão com conta e pagamento:** autenticação,
autorização por usuário, isolamento de dados no servidor, validação de webhook,
auditoria e revisão de segurança por terceiro. Nada disso é resolvível no
navegador — e o produto não afirma estar seguro contra tudo.

## 6. Acessibilidade

axe-core (wcag2a, wcag2aa, wcag21a, wcag21aa, best-practice) em 22 rotas,
incluindo telas com dados: **zero violações**.

Contraste (`npm run contrast`, cálculo a partir dos tokens nos dois temas):
**26 pares verificados, 0 abaixo do mínimo**. Nesta rodada o par do texto de
apoio passou a ser cobrado como texto normal (4,5:1, antes 3:1) e os tokens
subiram para atender: 4,88:1 no escuro, 4,80:1 no claro.

Garantido por CSS e revisado: alvos de toque de 44–48 px, foco visível, link de
pular para o conteúdo, `prefers-reduced-motion` zerando animações, hierarquia de
títulos e rótulos nas navegações e medidores. A marca aparece duas vezes na
árvore (trilho e barra superior) e só uma delas é anunciada ao leitor de tela —
verificado por teste.

## 7. Responsividade

Nenhuma largura fixa fora de media query; os únicos grids com coluna em pixel
estão sob `min-width` de 720 px ou mais. Áreas seguras aplicadas na barra
superior, na navegação inferior e no menu "Mais".

## 8. O que não foi possível verificar aqui

Declarado em vez de presumido:

1. **Aparelho físico e navegador de verdade do usuário.** As medições e as
   capturas desta entrega vêm de Chromium headless em container. Safari,
   Firefox, iPhone e Android não foram abertos. Isso inclui teclado virtual
   sobre formulário longo e o comportamento do botão "voltar" do Android.
2. **Leitor de tela** (NVDA, VoiceOver, TalkBack) — o axe cobre o verificável
   por código, não a experiência por voz.
3. **Lighthouse e dados de campo.** Os números da seção 4.1 são de laboratório,
   com rede e CPU emuladas; não substituem CrUX nem medição com usuários reais.
4. **Rede ruim e armazenamento cheio em campo** — a classificação de erro de
   cota é testada em unidade, não em aparelho com disco cheio de verdade.
5. **Revisão de segurança independente.**

Para fechar 1 e 2 basta um celular e quinze minutos: o roteiro está em
`docs/deploy.md`, seção "Checklist de verificação em navegador real".
