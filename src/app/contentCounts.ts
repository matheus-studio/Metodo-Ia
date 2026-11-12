/**
 * Quanto conteúdo o produto traz pronto.
 *
 * Aparece na orientação de primeiro acesso do painel, para quem abre o
 * aplicativo vazio saber o que já existe lá dentro.
 *
 * Por que números literais em vez de `CATALOG.length`: importar os arquivos de
 * conteúdo aqui traria ~25 kB comprimidos de catálogo, biblioteca e academia
 * para dentro do chunk de entrada — justamente o que precisa abrir rápido.
 *
 * O risco de número literal é ele envelhecer — por isso `contentCounts.test.ts`
 * compara cada valor com o tamanho real das coleções e falha se divergirem.
 */
export const CONTENT_COUNTS = {
  servicos: 30,
  materiais: 41,
  aulas: 17,
  termos: 24,
} as const
