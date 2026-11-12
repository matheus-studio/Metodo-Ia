# Evolução comercial — contas, pagamentos e armazenamento

Documento de arquitetura. **Nada aqui está implementado**, e é proposital: uma
integração de pagamento falsa é pior do que nenhuma, porque esconde que a parte
difícil continua inteira. O que existe hoje é o contrato de tipos
(`src/integrations/billing/types.ts`) e uma implementação local que libera o que
é gratuito e **recusa** qualquer operação de cobrança
(`src/integrations/billing/localAccess.ts`), com teste que garante isso.

## 1. Onde o produto está

Sem conta, sem servidor, sem telemetria. Cada pessoa tem os próprios dados no
próprio navegador. Isso é uma vantagem real de privacidade e a razão de o
produto funcionar sem custo de infraestrutura — e é também o limite: não há
sincronização entre aparelhos, nem conteúdo protegido.

## 1.1 Como vender: produto para download ou acesso web pago

Comparação pedida, com a recomendação ao final.

| | **A — Produto digital para download** | **B — Aplicativo web com acesso pago** |
| --- | --- | --- |
| O que o comprador recebe | Um pacote (build pronto ou código) que ele publica ou abre | Um endereço com login |
| Complexidade para você | Baixa: hoje o produto já gera esse pacote | Alta: conta, servidor, banco, cobrança, suporte |
| Custo mensal | Praticamente zero (plataforma cobra por venda) | Servidor + banco + e-mail transacional + domínio, todo mês, independente de vender |
| Controle de acesso | Nenhum depois da entrega: o arquivo circula | Real, se feito no servidor |
| Pirataria | Alta, inerente ao modelo | Baixa |
| Atualização | Você precisa de uma estratégia de distribuição (e o comprador precisa aplicar) | Instantânea para todos |
| Experiência do comprador | Instala/abre sozinho; dados só no aparelho dele | Entra e usa; dados sincronizam quando houver servidor |
| Suporte | Mais difícil: cada comprador tem um ambiente | Mais fácil: ambiente único e observável |
| Privacidade | Excelente: nada sai do aparelho do comprador | Exige política de privacidade, base legal da LGPD e processo de exclusão |
| Caminho para as lojas | Direto: o mesmo build vira app com Capacitor, venda única pela loja | Também possível, mas a loja cobra comissão sobre assinatura e exige regras próprias |
| Tempo até a primeira venda | Dias | Meses |

**Recomendação: começar pela Alternativa A, estruturada para migrar para a B.**

Três razões:

1. **O produto já é compatível com A hoje.** Ele funciona sem servidor, sem conta e sem custo recorrente. A alternativa B exige construir tudo o que o documento abaixo descreve antes da primeira venda — e cobrar mensalidade de uma base que ainda não existe é o jeito mais rápido de operar no prejuízo.
2. **A privacidade é um argumento comercial, não um limite.** "Seus dados de clientes ficam no seu computador, sem conta e sem nuvem" é uma vantagem verdadeira para quem vende serviço e guarda contato de cliente.
3. **A migração não joga nada fora.** Quem comprar a versão A continua usando; a versão B entra como opção paga quando houver demanda por sincronização entre aparelhos — que é o único recurso que A realmente não entrega.

Como operacionalizar A sem fingir integração: a venda acontece na plataforma
externa (ela cobra, emite e entrega o arquivo), e o aplicativo não precisa saber
que a venda existiu. **Não** coloque validação de licença no frontend: ela seria
contornada em minutos e daria falsa sensação de controle.

Limites que precisam estar escritos na página de venda, antes da compra: o
arquivo pode ser compartilhado (você está vendendo confiança, não cópia), os
dados ficam no aparelho e não sincronizam, e as atualizações chegam pelo canal
que você definir — defina qual, e cumpra.

**Quando migrar para B:** quando a sincronização entre aparelhos virar o pedido
mais repetido do suporte, ou quando houver base suficiente para a mensalidade
cobrir servidor, suporte e o seu tempo. Até lá, B é custo fixo contra receita
incerta.

## 2. Ordem correta de implementação

Fora de ordem, cada etapa quebra a seguinte.

1. **Servidor + conta.** Sem identidade, não há o que proteger nem a quem entregar.
2. **Armazenamento remoto por usuário**, com isolamento garantido no banco (regra de acesso por linha), não só no código do aplicativo.
3. **Cobrança**, com checkout hospedado pelo provedor.
4. **Entrega de produto digital**, por URL assinada de validade curta.

## 3. Conta e sessão

- Cadastro com e-mail verificado; senha com hash forte (Argon2id ou bcrypt), nunca armazenada em texto.
- Sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Token em `localStorage` é alcançável por qualquer script da página — é o que transforma um XSS em sequestro de conta.
- Limite de tentativa de login por IP e por conta; recuperação de senha com token de uso único e expiração curta.

## 4. Pagamento

```
navegador                servidor                      provedor
   │  POST /checkout/sessao  │                              │
   │ ──────────────────────▶ │  cria sessão (chave secreta) │
   │                         │ ───────────────────────────▶ │
   │  ◀── url da sessão ──── │                              │
   │ ─────────────── redireciona o usuário ───────────────▶ │
   │                         │  ◀── webhook assinado ────── │
   │                         │  valida assinatura           │
   │                         │  grava pedido + entitlements │
   │  GET /conta/entitlements│                              │
   │ ──────────────────────▶ │                              │
```

Regras que não podem ser flexibilizadas:

- **Chave secreta só no servidor.** Se ela está no bundle, está publicada.
- **O retorno do navegador não libera nada.** `?status=sucesso` é texto que qualquer um digita. Quem libera é o webhook validado.
- **Verificar a assinatura do webhook** e tratar reenvio (idempotência por id do evento): provedores reenviam em caso de falha.
- **O acesso é decidido no servidor.** Esconder botão é interface, não autorização. Todo endpoint protegido verifica de novo.
- **Cancelamento e inadimplência rebaixam o acesso** na data correta, sem apagar os dados do usuário.

## 5. Entrega de produto digital

- Arquivo vendido fica em armazenamento privado, nunca em pasta pública com link adivinhável.
- Download por URL assinada, com validade de minutos e vinculada à conta.
- Registro de cada download (quem, quando, qual versão) para suporte e para detectar abuso.
- Limite de downloads por pedido, com política dita ao comprador antes da compra.

## 6. Armazenamento: do local ao remoto

A camada de repositórios (`src/storage/repository.ts`) já isola o acesso a
dados por trás de `Repository<T>`. A migração tem um caminho previsto:

1. Implementar `createRemoteRepository<T>()` com a mesma interface, falando com a API.
2. Escolher a estratégia por coleção: dados do usuário vão para o servidor; resultados de provedor externo obedecem à licença da fonte e podem não poder ser persistidos.
3. Fase de convivência: gravar nos dois (local e remoto) e ler do local, até confiar na sincronização.
4. Resolver conflito por `updatedAt` com registro do que foi sobrescrito — e nunca descartar a versão perdida sem gravá-la em algum lugar.
5. Migração inicial do usuário existente: exportar o backup local e enviá-lo no primeiro login, reaproveitando o formato e a validação que já existem.

Nenhum componente conhece IndexedDB diretamente, então essa troca não toca nas
telas.

## 7. O que precisa existir antes de cobrar por isto

Lista honesta de pendências, em ordem de risco:

- autenticação e autorização reais, com isolamento de dados no banco;
- validação de webhook e auditoria de eventos de pagamento;
- política de privacidade e termos de uso escritos, com base legal da LGPD para cada dado coletado;
- processo de exclusão de conta e de dados a pedido do titular;
- revisão de segurança por alguém de fora, com foco em OWASP;
- plano de backup e de recuperação do lado do servidor;
- suporte: canal, prazo de resposta e política de reembolso.

Enquanto esses itens não existirem, a versão publicada deve ser tratada como
demonstração. O produto não traz mais uma página de apresentação na frente dele
(a raiz é o aplicativo), então esse aviso precisa estar **no material de venda**
— na página da plataforma onde a compra acontece, antes do pagamento.
