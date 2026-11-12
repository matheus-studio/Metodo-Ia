# Método IA Pro — versão desktop (Windows)

Este pacote empacota o mesmo aplicativo web do projeto principal como um
programa de computador nativo, usando [Electron](https://www.electronjs.org/).
Nada na lógica do produto muda: é a mesma interface, os mesmos módulos, os
mesmos dados em IndexedDB — só que dentro de uma janela própria, sem depender
de um navegador ou de um link.

## O que isso resolve

- **Venda única, sem conta e sem servidor.** O comprador recebe um instalador
  (`.exe`). Depois de instalado, o aplicativo abre como qualquer programa do
  Windows — sem login, sem internet, sem mensalidade.
- **Os dados ficam no computador de quem compra.** O armazenamento usa
  IndexedDB dentro da pasta de perfil do próprio aplicativo (isolada por
  aplicativo, não por site). Isso foi testado de verdade: grava-se um
  registro, o programa é encerrado por completo, reaberto, e o registro
  continua lá.
- **Nenhuma verificação de licença no frontend.** Como já documentado em
  `docs/comercial.md`, esse tipo de verificação é contornável em minutos e
  só daria uma falsa sensação de controle. A proteção de quem paga e quem
  não paga é responsabilidade da plataforma de venda (Kiwify), não deste
  aplicativo.

## Estrutura

```
desktop/
├── main.js            # processo principal do Electron (janela, protocolo, CSP)
├── package.json        # dependências e configuração do electron-builder
├── scripts/
│   └── copy-app.mjs    # copia dist-app/ (build do projeto principal) para desktop/app/
├── build/
│   ├── icon.ico         # ícone do instalador/executável (Windows)
│   └── icon.png         # ícone da janela em tempo de execução
└── app/                 # gerado automaticamente — build do aplicativo copiado aqui
```

`app/` nunca é editado à mão: ele é apagado e recopiado a cada build a partir
de `dist-app/`, que por sua vez é gerado pelo projeto principal.

## Como gerar o instalador

Na raiz do projeto (uma pasta acima desta):

```bash
npm run build:app -- --outDir dist-app
```

Isso gera o build do aplicativo com rotas em modo hash (`#/painel`, `#/crm`,
etc.), necessário porque o protocolo customizado `app://` usado aqui não tem
um servidor com regras de rewrite por trás — o roteador precisa resolver as
rotas sozinho no navegador.

Depois, dentro de `desktop/`:

```bash
npm install
npm run build:win            # gera o instalador NSIS (.exe) e um .zip portátil
# ou, só o .zip portátil, sem instalador:
npm run build:win:portable
```

Os arquivos finais aparecem em `desktop/release/`:

- `MetodoIAPro-Instalador-<versão>.exe` — instalador completo (um clique,
  sem precisar de permissão de administrador: instala só para o usuário
  atual).
- `Método IA Pro-<versão>-win.zip` — versão portátil, sem instalador: basta
  extrair e executar `Método IA Pro.exe`.

## Rodar em modo de desenvolvimento (Linux/macOS/Windows)

```bash
npm run dev
```

Isso copia o build mais recente de `dist-app/` e abre a janela do Electron
direto, sem gerar instalador — útil para testar mudanças rapidamente.

## Sobre a ausência de assinatura de código

Esta primeira versão é distribuída **sem certificado de assinatura de
código** (decisão tomada deliberadamente, para não adicionar custo recorrente
a um produto de pagamento único). Isso tem uma consequência visível: ao
instalar, o Windows SmartScreen vai mostrar um aviso de "Windows protegeu o
seu PC" / "aplicativo não reconhecido", porque o `.exe` não tem uma
assinatura digital verificada por uma autoridade confiável. Isso é esperado
e não indica nenhum defeito ou risco no aplicativo — é só o Windows avisando
sobre qualquer executável novo, não assinado, vindo de fora da loja. O
comprador precisa clicar em "Mais informações" → "Executar assim mesmo" para
seguir. Esse aviso e como explicá-lo ao comprador estão detalhados em
`docs/download.md`.

Se no futuro fizer sentido eliminar esse aviso, a opção é comprar um
certificado de assinatura de código (EV ou OV) de uma autoridade certificadora
e assinar o `.exe` com `signtool` (Windows) ou configurar `certificateFile`/
`certificatePassword` no bloco `win` do `electron-builder`. Isso tem custo
anual e não foi feito aqui.

## O que foi testado neste ambiente

- Build completo do instalador NSIS e do `.zip` portátil, com `electron-builder
  26.18.0` e `electron 38.4.0`.
- Abertura do aplicativo empacotado (build Linux equivalente, usado só para
  verificação funcional neste ambiente — o artefato final entregue é o
  Windows) sob um display virtual (`Xvfb`), com inspeção via Chrome DevTools
  Protocol: a tela inicial carrega, o menu e os módulos aparecem, o texto de
  primeira execução é exibido corretamente.
- Persistência de dados: um registro foi gravado em IndexedDB, o processo do
  aplicativo foi encerrado por completo (não só a janela — todos os processos
  filhos do Electron) e, ao reabrir, o mesmo registro foi lido de volta.
- Política de segurança de conteúdo (CSP) aplicada nas respostas do protocolo
  `app://`, igual à usada no deploy web (sem `unsafe-inline` em `script-src`).
- Links `http://`/`https://` abertos dentro do aplicativo (ex.: WhatsApp Web
  na prospecção) abrem no navegador padrão do sistema, nunca dentro de uma
  nova janela do próprio Electron.

## O que não foi testado neste ambiente

- **Execução real em Windows.** Os binários foram gerados em Linux usando
  Wine para o utilitário de empacotamento (`rcedit`), que é a forma padrão e
  suportada de gerar builds Windows em CI sem uma máquina Windows física —
  mas o `.exe` final não foi executado em uma máquina Windows real dentro
  deste ambiente. Recomenda-se testar a instalação em pelo menos um Windows
  real antes da venda.
- **O aviso real do SmartScreen**, que só aparece em Windows.
