# server/

**Vazio de propósito.** Nenhum servidor é necessário para o que o produto faz
hoje: tudo roda no navegador, com os dados no aparelho do usuário.

Esta pasta existe para marcar o lugar e registrar o contrato do que vai entrar
aqui quando chegar a hora. Duas coisas exigem servidor, e nenhuma delas pode ser
resolvida no frontend:

## 1. Radar de empresas reais (Marco 3)

```
POST /api/radar/buscar
  entrada:  { cidade, segmento, limite }
  saída:    { resultados: [...], fonte, consultadoEm, custoEstimado }
```

Responsabilidades do servidor, não negociáveis:

- guardar a credencial do provedor (jamais no bundle);
- validar os parâmetros antes de chamar a fonte;
- limitar por usuário e por período (rate limit e quota);
- cortar requisição por tempo e tamanho, e bloquear destino arbitrário (anti-SSRF);
- aplicar a política de retenção da licença da fonte — o que pode ou não ser guardado;
- devolver erro tratado, sem vazar detalhe interno.

## 2. Conta, cobrança e acesso a produto pago (futuro)

```
POST /api/conta/registrar          POST /api/checkout/sessao
GET  /api/conta/entitlements       POST /api/webhook/pagamento
GET  /api/conta/pedidos            GET  /api/produto/:id/download
```

Contratos de tipos já escritos em `src/integrations/billing/types.ts`. As
regras que a implementação precisa obedecer estão em `docs/comercial.md`; em
resumo: o acesso é decidido pelo servidor, o evento de pagamento só vale depois
de validada a assinatura do webhook, e arquivo vendido é entregue por URL
assinada e de validade curta — nunca por link estático em pasta pública.

## Por que não há um esqueleto pronto

Um servidor sem provedor escolhido, sem domínio e sem política de dados definida
seria código morto que envelhece. Quando a fonte do Radar e o provedor de
pagamento forem decididos, a implementação entra aqui — e aí sim com testes de
limite, de abuso e de falha do provedor, que são os testes que importam.
