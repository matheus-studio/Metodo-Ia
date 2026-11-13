# Publicar a versão web instalável (PWA)

O build é o mesmo do Windows e do Android: `npm run build:app -- --outDir dist-app`.
Funciona na raiz de um domínio ou numa subpasta, sem regras de redirecionamento,
porque as telas ficam no fragmento da URL (`#/crm`).

## Teste rápido: GitHub Pages (grátis, uns 10 minutos)

O repositório já tem o publicador (`.github/workflows/pages.yml`).

1. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**. (Uma vez só.)
2. Aba **Actions → Publicar versão web (PWA) → Run workflow** (ou qualquer envio para `main`).
3. Quando ficar verde, o endereço é `https://matheus-studio.github.io/Metodo-Ia/`.

Atenção: enquanto o repositório for público, esse endereço e o código ficam
abertos a qualquer pessoa. Serve para **testar**, não para vender. E o GitHub
Pages em repositório privado exige plano pago.

## Endereço definitivo (para vender)

Qualquer hospedagem de arquivos estáticos serve. Opções comuns, todas com
plano gratuito (confira as condições atuais de cada uma): Netlify, Cloudflare
Pages, Vercel. Conecte o repositório **privado**, comando de build
`npm run build:app -- --outDir dist-app`, pasta de publicação `dist-app`.
Já existem `netlify.toml` e `vercel.json` no projeto, mas eles são para o build
com rotas limpas (`npm run build`, pasta `dist`); para o PWA com rotas no
fragmento, use o comando acima.

Ter um **domínio próprio** (ex.: app.seudominio.com.br) transmite mais
confiança ao comprador do que um endereço de hospedagem.

## O que foi testado e o que não foi

Testado num Chromium real (simulando celular), servido numa subpasta:

- O Chromium considera o app instalável (sem erros de instalabilidade; manifesto válido; ícones normais e "maskable").
- O service worker guarda os 65 arquivos do app; **recarregar com a internet desligada abre o app**, abre outra tela carregada sob demanda e mostra um dado salvo antes.
- Uma versão nova é baixada em segundo plano e **espera**; a janela aberta continua funcionando na versão antiga; ao fechar e reabrir, a nova assume e o cache antigo é apagado.
- O aviso "Instale o aplicativo" aparece quando o navegador oferece instalar (simulando o evento).

**Não testado:** instalação em celular físico (Android/iPhone), o fluxo do
Safari no iPhone, e comportamento do armazenamento depois de semanas sem abrir
o app em cada sistema. Teste no seu celular antes de vender.

## Limites conhecidos

- Os dados ficam no navegador do aparelho. Limpar dados do site ou desinstalar pode apagar tudo: por isso o guia insiste em backup.
- No iPhone, só o Safari instala.
- Quem tem o link usa (ver `00-leia-primeiro.md`).
- Atualizações chegam na próxima abertura do app depois de fechado, não no meio do uso.
