# Lançamento do Método IA Pro — por onde começar

Data desta versão: 12/11/2026 · Versão do produto: 0.5.0

## Onde o produto está, plataforma por plataforma

| Plataforma | Estado | O que falta |
| --- | --- | --- |
| **Windows** | Pronto. Instalador `.exe` gerado, abre e carrega o app (testado em ambiente simulado, não em Windows real). | Testar uma instalação num Windows de verdade antes de vender (15 min). |
| **Linux** | Pronto. `AppImage` (roda na maioria das distribuições) e `.tar.gz`. O AppImage foi aberto e carregou o app. | Nada além do teste real em uma máquina Linux, se quiser. |
| **Android** | Projeto pronto, ícone, assinatura configurada e pipeline automático escrito. **O APK ainda não foi gerado**: o ambiente onde trabalhei bloqueia os servidores do Google necessários para compilar. | Rodar o pipeline no GitHub (passo a passo em `04-android-ci.md`, ~30 min na primeira vez) e instalar o APK em um celular. |
| **iPhone / Mac** | **Não incluído nesta versão.** | Exigem conta Apple paga e um Mac para publicar. Alternativa e custo no fim deste arquivo. |

Como o Android é o público principal, ele é a prioridade número 1 antes de anunciar.

## Ordem sugerida (do que trava a venda para o que pode esperar)

1. **Gerar o APK** (`04-android-ci.md`) e instalar num celular real. Conferir: abre, navega, salva um cliente no CRM, fecha e reabre com os dados lá, e **exportar backup** abre a janela de compartilhar. Esse último ponto foi escrito mas **não pôde ser testado em aparelho** — é o item mais importante a conferir.
2. **Testar o instalador Windows** em um PC de verdade (vai aparecer o aviso do SmartScreen, explicado no guia do comprador).
3. **Decidir preço e plataforma de venda** (Kiwify, Cakto, Hotmart… o processo é parecido).
4. **Criar o produto** na plataforma com o texto de `01-pagina-de-venda.md`.
5. **Definir a entrega** (ver abaixo).
6. **Fazer uma compra de teste** do seu próprio produto (use um cupom 100% ou peça reembolso depois) e seguir o guia do comprador como se fosse um cliente.
7. Só então divulgar.

## Como entregar (o ponto que você ainda não tinha decidido)

O comprador precisa receber **links de download** (3 arquivos grandes, de 100 a 130 MB cada no desktop). Opções, da mais simples:

- **Link externo na mensagem de entrega.** Você sobe os arquivos em um lugar (Google Drive, Dropbox, ou a aba Releases do GitHub) e coloca os links na página/área de membros que a plataforma mostra após a compra. Simples e sem limite de tamanho da plataforma, mas **o link pode ser repassado** — o mesmo vale para qualquer arquivo vendido.
- **Enviar os arquivos para a própria plataforma** (se ela aceitar arquivos desse tamanho). Os limites mudam; confira no painel da sua plataforma antes de contar com isso. Não verifiquei esse limite.

Sugestão: comece com link externo (Drive), com os arquivos nomeados claramente (`MetodoIAPro-Windows`, `MetodoIAPro-Android`, `MetodoIAPro-Linux`) e o `02-guia-do-comprador` anexado ou colado na mensagem de entrega.

## Limites que precisam estar na página de venda

Já estão no texto de `01-pagina-de-venda.md`. Resumo: sem iPhone/Mac, dados só no aparelho (sem sincronizar), a IA não vem embutida (o app monta os prompts; você usa a IA que já tem), aviso do Windows na instalação e instalar APK fora da Play Store.

## E o iPhone / Mac?

- **Opção mais barata:** publicar a versão web (já pronta, ver `docs/deploy.md`) e ensinar o comprador a "Adicionar à Tela de Início". Limitações honestas: precisa de internet para abrir (ainda não há modo offline) e **o endereço funciona para qualquer pessoa que o receber**, sem proteção. Só faz sentido vender assim sabendo disso.
- **Caminho oficial (App Store):** conta de desenvolvedor Apple (paga, anual), um Mac para compilar, revisão da Apple. É um projeto à parte, não para esta semana.
- Para Mac, o `.dmg` assinado também exige a conta Apple. Sem ela o macOS bloqueia o app de forma bem mais agressiva que o Windows.

## O que mudou no produto nesta rodada

- Removido da barra lateral o bloco "Em construção / 1 módulo planejado" (o produto parecia inacabado; o plano continua na tela Roteiro, que fala honestamente do módulo "Encontrar Empresas", ainda não implementado).
- Exportar backup agora funciona no Android (abre a folha de compartilhar do sistema), além de continuar baixando arquivo no Windows/Linux/navegador.
- Versão Linux criada (AppImage + tar.gz).
- Build do app agora funciona também em Windows (`cross-env`).
- Pipeline do GitHub Actions para gerar Android, Windows e Linux.
- Script `scripts/gerar-chave-android.sh` para criar a chave de assinatura do APK.
- Material de venda (esta pasta).
