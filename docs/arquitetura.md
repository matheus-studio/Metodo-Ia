# Arquitetura — Método IA Pro

Documento de decisões. Atualizado na release candidate (14/10/2026). Resultados medidos ficam em `qualidade.md`.

## 1. Stack e porquê

| Escolha | Alternativa considerada | Motivo |
| --- | --- | --- |
| React 19 + TypeScript estrito + Vite | Next.js | Não há conteúdo público a renderizar no servidor nesta fase, e um app 100% estático publica em qualquer CDN, roda offline e empacota direto em WebView (Capacitor) sem servidor Node. |
| CSS moderno com *custom properties* | Tailwind | A identidade pede tokens próprios e componentes autorais. Tokens em CSS dão troca de tema sem recompilar, sem passo extra de build e sem classe utilitária no HTML inteiro. |
| Ícones próprios (`components/ui/Icon.tsx`) | lucide-react / heroicons | ~25 *paths* inline custam ~2 kB e garantem traço consistente com a marca. Uma biblioteca de ícones traria dezenas de kB e um estilo de terceiros. |
| Animação em CSS | Framer Motion | Transições de entrada, *stagger* e microinterações saem de `transform`/`opacity` com custo quase nulo. Motion entra depois, só se um gesto específico justificar. |
| IndexedDB com camada de repositórios | localStorage puro | Volume maior, dados estruturados e gravação assíncrona sem travar a interface. A interface `Repository<T>` isola a troca futura por backend remoto. |
| Vitest + Testing Library + fake-indexeddb | Jest | Mesma configuração do Vite, sem transpilação paralela. `fake-indexeddb` exercita o caminho real de persistência em vez de um mock do repositório. |

## 2. Camadas

```
features/*        telas e regras de cada módulo (lazy, um chunk por rota)
components/ui     primitivas visuais sem conhecimento de domínio
app/              composição: rotas, providers, registro de módulos
services/         orquestração entre módulos (dataBus, demoData)
repositories/     ponto único de acesso a dados
storage/          IndexedDB, preferências, backup — nenhuma tela fala com isso diretamente
types/            modelo de domínio compartilhado
```

Regra de dependência: `features` → `components`/`repositories`/`services`; nunca o contrário. Nenhum componente importa `storage/*` direto, exceto `settings` (que é a tela de gestão de dados).

### `app/modules.ts`

Fonte única de verdade sobre quais módulos existem e em que marco entram. A navegação renderiza só os de `status: 'disponivel'`; o motor de próximo passo usa a mesma lista para saber se pode oferecer um botão ou se deve apontar para o roteiro. Entregar um módulo = mudar o `status` e registrar a rota.

Consequência deliberada: **não existe botão que leve a tela vazia**. `primary: true` marca os módulos que cabem na barra inferior do celular; os demais vão para o menu "Mais", para a barra não virar uma fileira de ícones ilegíveis.

## 3. Dados

- `Entity` carrega `id`, `createdAt`, `updatedAt`; a camada de persistência é quem gera os três.
- `put()` preserva o `createdAt` original ao regravar o mesmo id — importante para a restauração de backup não reescrever o histórico.
- `CompanyLead.source` separa o que o usuário digitou (`manual`) do que vier de provedor externo (`provedor-externo`). Essa marcação é o que permitirá aplicar política de retenção diferente por origem no Marco 3.
- Registros de demonstração usam o prefixo `demo-` no id. Isso torna a remoção cirúrgica e impede que demonstração se misture a dado real.

### Backup

`storage/backup.ts` trata o arquivo importado como entrada hostil: tamanho máximo, envelope (`format`/`version`) obrigatório, coleções desconhecidas descartadas, registros sem `id` válido ignorados. O padrão é **mesclar**; substituir é destrutivo e só acontece por pedido explícito.

## 3.1 Integração entre módulos (Marco 2)

O encadeamento é o produto. Cada seta abaixo existe no código, não só no roteiro:

```
catálogo ──salvar──▶ oportunidade ──"construir serviço"──▶ blueprint
blueprint ──"gerar oferta"──▶ oferta (escopo e entregáveis pré-preenchidos)
catálogo/oferta ──"preparar abordagem"──▶ prospecção (serviço e benefício no contexto)
prospecção ──"registrar abordagem"──▶ negociação no CRM (estágio "contatado")
tudo ──▶ painel (contagens, funil e próximo passo recomendado)
```

Duas regras sustentam isso:

- **`dataBus`**: quem grava emite; quem lê se reinscreve (`useCollection`, `useSnapshot`). Sem store global e sem acoplar telas entre si.
- **Pré-preenchimento é ponto de partida, nunca decisão tomada.** O editor de oferta carrega o escopo do serviço, mas preço, prazo e revisões ficam vazios de propósito: são decisões do usuário, e `offerGaps()` cobra cada uma delas na própria tela.

## 3.3 Execução (Marco 4)

- **Progresso vem de fatos.** `projectProgress()` conta tarefas e entregáveis concluídos; o estágio é só um rótulo que o usuário move. Projeto em "execução" com nada feito mostra 0%.
- **Bloqueios com motivo.** `projectAdvice()` separa aviso de impedimento. Dois impedimentos existem: sair do briefing sem briefing, e dar o projeto por entregue com entregável sem aprovação registrada. Cada um aparece em texto antes de o botão desabilitar.
- **Aprovação é anotação, não assinatura.** O produto registra que *você* marcou a aprovação do cliente, e diz isso na tela. Assinatura eletrônica é outro produto.
- **Escrita sob foco.** Campos longos (briefing, notas) gravam ao perder o foco, não a cada tecla: gravação por tecla dispara escritas concorrentes no IndexedDB e a última a terminar vence, perdendo texto.

## 3.4 Precificação

`computeQuote()` responde "quanto preciso cobrar para este trabalho não sair no prejuízo" — pergunta que tem resposta a partir de dados do usuário. Dois detalhes que a maioria das calculadoras erra e aqui estão cobertos por teste:

1. **Horas invisíveis entram na conta.** Revisões e tempo de reunião/briefing são horas trabalhadas; ficar fora do cálculo é o modo mais comum de um projeto render menos que o valor-hora pretendido.
2. **Imposto é embutido, não somado.** O total é `valor / (1 - taxa)`, não `valor × (1 + taxa)`. Somar por fora deixa o líquido abaixo do custo.

## 3.5 Conhecimento e IA (Marco 5)

- **O Studio não chama modelo nenhum.** Ele compõe e revisa o texto do prompt com regras locais, e a interface afirma isso em destaque. Apresentar composição de texto como "IA conectada" seria vender fumaça; a arquitetura prevê a integração futura com a credencial no servidor.
- **O revisor julga estrutura, não conteúdo.** É o que dá para verificar sem executar o prompt: blocos ausentes, formato de saída indefinido e termo subjetivo usado como critério ("profissional", "de qualidade"). A checagem de termos roda só sobre o texto do usuário — os títulos das seções contêm palavras da própria lista.
- **Biblioteca com profundidade, não contagem.** A meta original era 40 a 50 materiais; entregar 22 completos, com conteúdo, dicas e critérios de revisão, vale mais do que 45 rasos. Um teste exige que todo material tenha corpo substancial ou prompt estruturado — nenhum pode ter os dois vazios.
- **Missões sem gamificação falsa.** Nenhum ponto, medalha ou nível. O progresso vem de `activity`, a mesma fonte do histórico do painel, contado na semana corrente (segunda a domingo). As metas são referência de ritmo, e a tela diz que não são promessa de resultado.
- **Academia aplicada.** Cada aula aponta o módulo onde aquilo é decidido, e o link só aparece se o módulo estiver entregue — a mesma regra de navegação do resto do produto.

## 3.2 O que o produto se recusa a calcular

Três ausências são decisões de projeto, não funcionalidades pendentes:

1. **Pontuação de demanda ou de potencial financeiro por serviço.** Não há base para calcular isso a partir de dados locais. `assessFit()` compara o serviço com as habilidades declaradas pelo usuário e com o esforço estimado — e diz exatamente em que se baseou.
2. **Previsão de receita ponderada por estágio.** `summarizePipeline()` soma apenas os valores que o usuário digitou nas negociações ativas, e informa quantas estão sem valor. Soma é soma; previsão exigiria histórico de conversão que não existe.
3. **Preço sugerido de mercado.** O catálogo traz *modelos de cobrança* (por projeto, por hora, mensalidade) e os riscos de cada um — nunca um número. Um teste automatizado falha se algum item do catálogo passar a conter valor em reais.

## 4. Desempenho

Medidas já aplicadas:

- Uma rota = um chunk (`React.lazy`), com `Suspense` e esqueleto de altura estável (evita CLS).
- Vendor separado para cache longo.
- Fontes variáveis autoprovidas, em `woff2`, subsetadas por idioma pelo `@fontsource` — sem requisição a terceiros e sem bloqueio de render externo.
- Animações restritas a `transform`/`opacity`, com `prefers-reduced-motion` respeitado globalmente.
- Iluminação ambiental é um gradiente pintado uma vez em `body::before`, não um elemento animado.
- Pré-carregamento de rota por intenção (ponteiro ou foco), fora do tratador do evento.

### CSS dividido por rota: a armadilha

Cada rota carrega o CSS do seu próprio chunk. Isso é ótimo para o primeiro carregamento e tem uma armadilha que custou caro na v0.6.0: uma classe declarada no arquivo de uma funcionalidade **não existe** na tela de outra. Como várias telas reaproveitavam classes de `settings.css`, `catalog.css` e `crm.css`, elas renderizavam sem parte do estilo — invisível nos testes, porque jsdom não aplica CSS.

A regra que vale a partir daqui: **classe usada por mais de uma funcionalidade mora em `src/design/patterns.css`**, que entra no CSS de entrada e é sempre carregado. Classe de uma tela só continua no arquivo dela. Custo da correção: 0,9 kB comprimidos no arquivo de entrada.

Conteúdo (catálogo, biblioteca, academia) vive em chunks próprios, carregados só por quem abre aquelas telas — por isso o primeiro carregamento não mudou do Marco 1 ao 5.

Build atual (produção, comprimido): vendor 82,4 kB · entrada 8,0 kB · painel 5,3 kB · CSS base ≈ 5,5 kB. Primeiro carregamento ≈ **101 kB comprimidos**, praticamente igual ao do Marco 1 mesmo com onze telas a mais — porque cada rota é um chunk e o catálogo (10,4 kB comprimidos) só é baixado por quem abre o Radar.

Orçamento declarado: ≤ 120 kB comprimidos no primeiro carregamento; cada rota nova ≤ 25 kB.

Metas de Web Vitals (LCP < 2,5 s, INP < 200 ms, CLS < 0,1): **medidas em Chromium real na v0.6.0** e atendidas nos dois perfis testados, inclusive com CPU 4× mais lenta e 4G lento (LCP 1,7 s, CLS 0,000, pior interação 96 ms). São números de laboratório, com rede e CPU emuladas — não substituem dado de campo. Os valores, o método e as ressalvas estão em `docs/qualidade.md`, seção 4.1. O orçamento de carga (`npm run budget`) continua rodando sobre o build real e falhando se o primeiro carregamento passar de 120 kB comprimidos.

Uma descoberta da medição: o pré-carregamento de rota por intenção disparava o `import()` dentro do próprio `pointerenter`, e aquele evento virava a interação mais lenta do aplicativo. A importação passou a ser agendada para o tempo ocioso — o download começa alguns milissegundos depois e o ponteiro responde no quadro seguinte.

## 4.1 Prospecção: limites assumidos

O módulo monta mensagem, abre a conversa e registra a tentativa. O que ele **não** faz, por decisão e não por falta de tempo: envio automático, envio em massa, importação de listas de contato de terceiros e qualquer integração que contorne as regras das plataformas de mensagem. `whatsappLink()` devolve `null` para número implausível — abrir conversa com desconhecido por erro de digitação é pior do que não abrir nada.

O gerador só escreve frases sustentadas por dados informados: campo vazio não vira texto, e a observação sobre o negócio aparece com um aviso pedindo confirmação antes do envio.

## 5. Segurança

Nesta fase o aplicativo não tem backend, conta nem segredo — a superfície é o navegador:

- TypeScript estrito; nenhuma injeção de HTML arbitrário (`dangerouslySetInnerHTML` não é usado em lugar nenhum), nenhum `eval`.
- Toda entrada persistida é revalidada na leitura (`storage/preferences.ts`, `storage/backup.ts`), porque localStorage e arquivo importado podem ter sido alterados fora do app.
- Operação destrutiva exige confirmação em dois passos na interface.
- `ErrorBoundary` mostra mensagem neutra; *stack* só no console em desenvolvimento.

O que **ainda não existe** e precisa existir antes de qualquer versão com dados privados ou pagamento: autenticação, autorização por usuário, isolamento de dados no banco, validação de webhook, auditoria, CSP e revisão à luz do OWASP. Nada disso pode ser resolvido escondendo botão no navegador.

## 5.1 Armazenamento: o que acontece quando ele falha

O repositório usa IndexedDB e, se uma operação falhar (janela anônima, banco
bloqueado, cota estourada), refaz a operação em memória **e** marca o estado
global de armazenamento. A interface então mostra uma faixa de aviso e o painel
de Configurações muda de "Gravando no aparelho" para "Apenas nesta aba".

A combinação é deliberada: engolir a falha perderia o que o usuário acabou de
digitar; falhar sem alternativa interromperia o trabalho; e gravar em memória
sem avisar seria o pior dos três — ele trabalharia a manhã inteira e perderia
tudo ao fechar a aba, tendo visto "salvo" em cada passo.

A restauração de backup é atômica: validação completa antes de gravar e escrita
em uma única transação do IndexedDB (`withStores`). Sem IndexedDB, a
atomicidade é obtida por retrato e recolocação, e a interface informa que a
gravação não foi atômica. Detalhes em `qualidade.md`.

## 6. Radar de empresas reais (Marco 3) — posição técnica

O módulo só entra quando três condições estiverem satisfeitas, e o Marco 1 já deixa o terreno preparado:

1. **Fonte com licença compatível com o uso pretendido.** Pontos a verificar nos termos vigentes antes de escrever a integração (não assuma nada daqui como parecer jurídico):
   - *Google Places*: avaliar em detalhe os limites de cache e reutilização de conteúdo e a vedação a montar base de dados própria/catálogo de leads. Se o uso pretendido (guardar empresas para prospecção recorrente) não couber nos termos, a fonte é inadequada para esse fim — mesmo sendo excelente para consulta pontual.
   - *OpenStreetMap* (via Overpass ou instância própria): licença ODbL, que permite uso comercial com atribuição e tem regras de compartilhamento para bases derivadas. Traz as tags `website`/`contact:website` e `phone`/`contact:phone`, exatamente o que a classificação de presença digital precisa. É hoje a candidata mais provável, com a ressalva de cobertura desigual por cidade e de política de uso do endpoint público.
   - *Dados públicos de empresas no Brasil* (base de CNPJ): cobertura ampla, mas exige leitura atenta da finalidade de uso e da LGPD quando houver dado de contato pessoal.
2. **Consulta atrás de backend.** Chave de API nunca no bundle. O servidor valida parâmetros, limita por usuário e por período, aplica quota e corta a requisição por tempo e tamanho (anti-SSRF, anti-abuso).
3. **Custo previsível.** Teto por consulta e por mês, visível antes de ativar; sem busca ilimitada.

Classificação de presença digital já modelada em `types/domain.ts`: `site-identificado`, `site-nao-cadastrado`, `site-nao-confirmado`, `presenca-verificada`. **Ausência de site na base nunca é apresentada como prova de que a empresa não tem site** — a interface precisa dizer isso ao usuário no ponto de uso, não em um rodapé.

Contratos implementados e isolados em `src/integrations/radar/`: a implementação padrão recusa a busca (nunca devolve lista vazia nem exemplo) e, na conversão para o CRM, descarta os campos que a licença da fonte não permitir guardar. A análise comparativa das fontes está em `radar.md`.

## 7. Próximos marcos

- **Marco 2 (entregue)** — catálogo de serviços, construtor de serviços, gerador de ofertas, prospecção e CRM, ligados entre si (oportunidade → serviço → oferta → abordagem → negociação).
- **Marco 3** — Radar de empresas reais, conforme a seção 6.
- **Marco 4 (entregue)** — briefings, projetos, tarefas, entregas e calculadora de preços.
- **Marco 5 (entregue)** — IA Studio, Biblioteca, Academia, missões.
- **Marco 6 (entregue)** — desempenho, acessibilidade e segurança medidos; resultados e pendências em `qualidade.md`.
- **Marco 7 (entregue)** — configuração de publicação (reescrita de rotas, cabeçalhos, CSP), CI com o pipeline de qualidade, contratos de cobrança sem integração falsa e preparação para Capacitor. Ver `deploy.md` e `comercial.md`.
