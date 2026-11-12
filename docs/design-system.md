# Identidade visual — "Luz de estúdio sobre grafite"

## Conceito

A tela é um estúdio escuro com uma fonte de luz quente. O grafite azulado não é "fundo preto": tem temperatura fria, e é isso que faz o âmbar parecer luz incidindo, não neon colado por cima. A profundidade vem de três coisas — um gradiente ambiental fixo, superfícies translúcidas sobrepostas e um fio de luz no topo de cada painel — e não de bordas brilhantes em todo elemento.

Por que âmbar e não o azul elétrico com verde do protótipo anterior: azul+verde sobre preto é a paleta padrão de praticamente todo produto de IA, e o resultado lê como genérico. O âmbar sobre grafite é incomum em software de produtividade, é quente (combina com um produto sobre *pessoas* vendendo serviços) e ainda deixa o ciano livre para o papel que ele cumpre melhor — dado e informação.

## Cor

Papéis, não enfeites. Cada cor tem uma função e só aparece nela:

| Papel | Token | Uso |
| --- | --- | --- |
| Ação / foco | `--accent` (âmbar) | Botão primário, rota ativa, progresso, próximo passo. |
| Dado | `--data` (ciano) | Indicadores, informação neutra. Nunca em botão de ação. |
| Positivo | `--success` (jade) | Negociação fechada, confirmação. |
| Risco | `--danger` (rosa) | Exclusão, falha. |
| Estrutura | escala `--graphite-*` | Fundo, superfícies, fios de 1px. |

O tema claro não é uma inversão automática: a escala de grafite vira uma base fria quase branca, o âmbar escurece um passo (`--amber-500`) para manter contraste de texto, e as sombras trocam de intensidade. Ambos os temas usam os mesmos nomes de token — nenhum componente conhece a cor literal.

## Tipografia

- **Títulos:** Bricolage Grotesque Variable. Grotesca com desenho autoral, boa em corpos grandes, com personalidade sem virar display decorativa.
- **Texto e números:** Inter Variable, com `font-variant-numeric: tabular-nums` na classe `.tabular` para que indicadores não "dancem" ao atualizar.
- Escala fluida em `clamp()`: do celular ao desktop o salto é contínuo, sem degrau em breakpoint.
- Ambas são servidas pelo próprio aplicativo (`@fontsource`), em `woff2` subsetado. Nada de requisição a CDN de terceiros — é mais rápido e evita expor o visitante a outro domínio.

### Rótulos em caixa baixa

Linhas de contexto (`.eyebrow`), rótulos de indicador e legendas são escritos em caixa baixa, sem espaçamento forçado entre letras. Caixa alta espaçada é o enfeite tipográfico mais comum em painel de software: chama mais atenção que o próprio título, piora a leitura de palavra longa em português e, repetida em trinta telas, vira ruído. O que separa rótulo de título aqui é tamanho, peso e tinta — não maiúscula.

## Movimento

Regras, não efeitos:

1. Só `transform` e `opacity`.
2. Entrada curta e contida: 6 px de deslocamento em 260 ms, com o escalonamento somado parando em ~165 ms. Bloco entrando de longe, em cada tela, parece apresentação de slides e atrasa a leitura.
3. Troca de rota é só luz — `fade`, sem deslocamento. O conteúdo aparece onde vai ficar.
4. Animação nunca bloqueia clique; nada de `pointer-events: none` durante entradas.
5. `prefers-reduced-motion: reduce` zera tudo globalmente, inclusive `scroll-behavior`.
6. Reflexo no botão primário só no hover, só uma passada.

A sensação cinematográfica vem de *timing*, direção da luz e hierarquia — não de quantidade de movimento.

## Marca

Um **M geométrico de traço único em que a diagonal ascendente é a parte acesa** e passa um pouco além do topo. A forma diz as duas coisas ao mesmo tempo: o M do nome e a subida do método — da oportunidade à execução. Os dois montantes e a primeira diagonal ficam na cor do texto; só a segunda diagonal recebe âmbar, que é a única cor forte da marca.

Decisões por trás do desenho:

- **Por que não os arcos anteriores:** três arcos saindo de um ponto é o desenho de wi-fi, RSS e radar ao mesmo tempo — não pertencia a ninguém. Pior: o produto tem um módulo chamado Radar, e a marca prometia esse módulo na tela inteira.
- **Uma cor só, num traço só.** Sem gradiente, sem brilho, sem placa atrás. O âmbar marca exatamente o movimento que o produto vende.
- **Assimetria proposital:** a diagonal ultrapassa a linha de topo. É o que torna o desenho reconhecível a 16 px, onde um monograma simétrico vira mancha.
- **Nome escrito sem selo:** "Pro" é parte do nome, na mesma família e peso, só com tinta mais baixa. Pílula colorida em volta de uma sílaba é enfeite de modelo pronto.

Geometria em grade de 48, traço de 5, pontas arredondadas. Componente em `src/brand/Logo.tsx` (herda os tokens de tema, muda com o tema claro) e arquivo estático em `public/logo.svg`, com placa de grafite, para ícone de aplicativo e favicon.

## Sem página de apresentação

O endereço raiz é o aplicativo. Não existe página comercial na frente dele: quem abre, abre a ferramenta. A orientação de quem chega pela primeira vez acontece dentro do painel — o texto de abertura diz o que já existe pronto lá dentro e some assim que houver o primeiro registro. Material de venda, quando existir, mora fora do produto.

## Acessibilidade

Referência: WCAG 2.2 AA.

- Foco visível em tudo, com `:focus-visible` e `outline-offset`.
- Alvos de toque ≥ 44 px em campos e ≥ 48 px na navegação inferior.
- Link "pular para o conteúdo" como primeiro elemento focável.
- Hierarquia de títulos real (um `h1` por tela), `aria-label` nas navegações, `role="progressbar"` com valores nos medidores.
- Ícone decorativo é `aria-hidden`; ícone com significado recebe rótulo.
- Nenhuma informação transmitida só por cor: o funil mostra o número, os estágios têm texto.

- Texto de apoio (`--text-muted`) alcança 4,5:1 nos dois temas, a exigência de texto normal. Antes ele era cobrado como texto grande (3:1) e ficava em 3,45:1 — legível como legenda, apertado como linha de conteúdo.

Contraste verificado por `npm run contrast`, que calcula a razão a partir dos próprios tokens nos dois temas: 26 pares, 0 abaixo do mínimo. Falta auditar com leitor de tela real (ver `docs/qualidade.md`).
