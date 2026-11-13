# Publicação

O aplicativo é 100% estático: build gera `dist/` e qualquer hospedagem de
arquivos serve. Não há servidor, banco remoto nem variável de ambiente secreta
nesta fase.

## 1. Build

```bash
npm ci
npm run build      # verificação de tipos + build em dist/
npm run budget     # confere o orçamento de carga sobre o dist/ gerado
npm run preview    # serve o dist/ localmente para conferir antes de publicar
```

## 2. A regra que não pode faltar: reescrita para o index

O roteamento é por caminho (`/painel`, `/crm`, `/ofertas/123`). Numa hospedagem
estática sem configuração, recarregar `/painel` devolve **404**, porque não
existe arquivo nesse caminho. Toda rota precisa cair no `index.html`.

Já estão no repositório:

| Arquivo | Para |
| --- | --- |
| `public/_redirects` | Netlify e compatíveis |
| `netlify.toml` | Netlify (build, reescrita, cabeçalhos e CSP) |
| `vercel.json` | Vercel (build, reescrita e cabeçalhos) |

Em **GitHub Pages**, que não oferece reescrita, use o build com rota no
fragmento da URL:

```bash
npm run build:app   # VITE_ROUTER=hash, caminhos relativos
```

O mesmo build serve para abrir o `dist/` direto do sistema de arquivos.

## 3. Cabeçalhos recomendados

Já configurados em `netlify.toml` e `vercel.json`:

- `Cache-Control: immutable` por um ano em `/assets/*` — os nomes têm hash, então cache longo é seguro e o conteúdo novo vem com nome novo.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` desligando câmera, microfone e localização — o produto não usa nenhum deles.
- **CSP** (no `netlify.toml`): `script-src 'self'` sem `unsafe-inline`. O `style-src` precisa de `'unsafe-inline'` porque medidores e barras de progresso passam o valor por variável CSS inline. Quando houver API própria, `connect-src` ganha o domínio dela — e só ele.

## 4. Antes de publicar em endereço público

O aplicativo **não tem controle de acesso**. Qualquer pessoa com o endereço abre
todas as telas. Como os dados ficam no navegador de cada visitante, ninguém vê
os registros de ninguém — mas também não há nada protegido ali.

Consequências práticas:

1. Trate uma instalação pública como demonstração, não como produto pago protegido.
2. Não coloque dado de cliente real numa instalação que você não controla.
3. Conteúdo pago só faz sentido depois de conta, servidor e verificação de acesso (ver `docs/comercial.md`).

## 4.1 Checklist de verificação em navegador real

Parte disto já roda aqui em Chromium headless (console limpo, LCP/CLS/INP,
capturas das duas temáticas — ver `docs/qualidade.md`). O que ainda depende de
um aparelho de verdade, e vale quinze minutos seus na primeira publicação:

- [ ] Abrir `/` (é o painel, não há página de apresentação); **recarregar** em `/crm` e `/ofertas/nova` (valida a regra de reescrita)
- [ ] Console sem erro, inclusive de CSP (a aba Console acusa bloqueio de script) — em produção, com os cabeçalhos reais da hospedagem
- [ ] Tema claro e escuro, e a troca entre eles sem flash
- [ ] Navegar só pelo teclado: Tab, Enter, Esc; o link "pular para o conteúdo" aparece no primeiro Tab
- [ ] Celular real: barra inferior, menu "Mais", teclado virtual sobre formulário longo
- [ ] Cadastrar, editar e excluir um registro; fechar o navegador e reabrir (os dados devem continuar lá)
- [ ] Janela anônima: a faixa de aviso de armazenamento precisa aparecer
- [ ] Exportar backup, apagar tudo, restaurar o arquivo; depois tentar importar um arquivo inválido
- [ ] Safari e Firefox, além do Chrome

## 5. Aplicativo Android (Capacitor)

O projeto Android já está gerado e commitado em `android/` (Capacitor 8.6.0),
com ícone próprio em todas as densidades, `versionName` sincronizado com o
app (0.6.0) e `webDir` apontando para `dist-app` (build com rota no
fragmento — a `WebView` do Capacitor não reescreve URL como um servidor
faria).

```bash
npm run build:app -- --outDir dist-app   # gera o build que o Android empacota
npx cap sync android                      # copia dist-app/ para dentro do projeto Android
npx cap open android                      # abre no Android Studio, numa máquina com ele instalado
```

Dentro do Android Studio (ou via `./gradlew assembleRelease`/`bundleRelease`
na linha de comando), os passos usuais de qualquer app Android:

1. Gerar/registrar uma chave de assinatura (`keytool -genkey` ou o assistente
   do próprio Android Studio) — sem isso não é possível gerar um `.aab`/`.apk`
   de release para publicar.
2. Rodar `./gradlew bundleRelease` (gera o `.aab` para a Play Store) ou
   `./gradlew assembleRelease` (gera um `.apk` para distribuir fora da Play
   Store, que é o caminho equivalente ao instalador do Windows — Kiwify entrega
   o `.apk` direto, sem passar pela Play Store).
3. No primeiro teste em aparelho físico ou emulador, confirmar: navegação
   inferior com áreas seguras, botão "voltar" do Android fechando telas em vez
   de sair do app, teclado virtual não cobrindo campos de formulário longos.

**Importante e verificado neste ambiente:** não foi possível compilar o
projeto Android aqui. Este ambiente de nuvem bloqueia o acesso aos
repositórios Maven do Google e do Gradle (`dl.google.com`,
`repo.maven.apache.org`, `services.gradle.org` — todos retornam
`403 Forbidden` mesmo usando o Gradle já instalado no sistema, sem depender do
download do wrapper). Isso não é uma falha do projeto: é uma restrição de rede
deste ambiente de execução. O scaffold está correto e completo — falta rodar
a compilação numa máquina com acesso normal à internet (sua própria máquina,
ou um runner de CI como GitHub Actions, que tem acesso irrestrito a esses
repositórios por padrão).

## 6. Instalar pela tela inicial (PWA parcial)

`public/manifest.webmanifest` permite adicionar à tela inicial com ícone e
abertura em tela cheia. **Não há service worker**: sem rede, o aplicativo não
abre (os dados continuam no aparelho, intactos, quando a rede volta). Um service
worker mal testado causa tela em branco por cache velho — entra quando houver
navegador real para testar atualização e invalidação.
