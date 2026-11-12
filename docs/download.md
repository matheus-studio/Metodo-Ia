# Entrega via Kiwify — venda única, sem conta

Este documento descreve a Alternativa A de `docs/comercial.md` já
implementada: o produto é vendido como download, pagamento único, sem conta
e sem servidor. Esta página cobre o que efetivamente existe hoje — não é um
plano para o futuro.

## O que o comprador recebe

Dois arquivos independentes, um por plataforma. Cada comprador baixa o que
serve para o aparelho dele; não é necessário comprar os dois separadamente
se a Kiwify permitir empacotar ambos num único produto com dois anexos.

| Plataforma | Arquivo | Gerado em |
| --- | --- | --- |
| Windows | `MetodoIAPro-Instalador-<versão>.exe` (instalador) ou `Método IA Pro-<versão>-win.zip` (portátil) | `desktop/README.md` |
| Android | `.apk` assinado | `docs/deploy.md`, seção 5 — **ainda precisa ser compilado numa máquina com acesso normal à internet**, ver abaixo |

Depois de instalado, o aplicativo abre como qualquer programa/app comum:
sem login, sem internet necessária, sem mensalidade. Os dados ficam em
IndexedDB, isolados no dispositivo de quem compra.

## O que ainda falta para o Android

O scaffold Android (pasta `android/`) está gerado, com ícone próprio e
versão sincronizada com o restante do app. Mas **o `.apk` não foi compilado
neste ambiente** — os repositórios do Google e do Gradle estão bloqueados
pela rede deste ambiente de nuvem (confirmado com erro `403 Forbidden` em
`dl.google.com`, `repo.maven.apache.org` e `services.gradle.org`, mesmo
usando o Gradle do sistema diretamente). Isso é uma restrição deste
ambiente, não do projeto.

Para gerar o `.apk` de venda, numa máquina com internet normal (a sua, ou um
runner de CI como GitHub Actions):

```bash
npm ci
npm run build:app -- --outDir dist-app
npx cap sync android
cd android
# primeira vez: gerar uma chave de assinatura própria
keytool -genkey -v -keystore metodo-ia-pro.keystore -alias metodo-ia-pro \
  -keyalg RSA -keysize 2048 -validity 10000
# configurar essa chave em android/app/build.gradle (signingConfigs) antes do release
./gradlew assembleRelease
```

O `.apk` final fica em
`android/app/build/outputs/apk/release/app-release.apk`. Guarde a chave de
assinatura (`metodo-ia-pro.keystore`) em lugar seguro: ela precisa ser a
mesma em toda atualização futura do app — perdê-la significa não poder mais
atualizar quem já instalou, só lançar como um app novo.

## O aviso do Windows SmartScreen

Como decidido deliberadamente (ver `desktop/README.md`), o `.exe` não tem
assinatura de código paga. Isso significa que, ao instalar no Windows, vai
aparecer o aviso "O Windows protegeu o computador" / aplicativo não
reconhecido. **Isso precisa estar escrito na página de venda, antes da
compra** — é a mesma regra que `docs/comercial.md` já estabelece para
qualquer limite do produto: dizer antes, não deixar o comprador descobrir
depois.

Texto sugerido para a página de venda ou para um e-mail de boas-vindas:

> Ao instalar no Windows, pode aparecer um aviso do SmartScreen dizendo que o
> aplicativo "não é reconhecido" ou "pode representar um risco". Isso
> acontece com qualquer programa novo que ainda não tem assinatura digital
> paga — não é um alerta de vírus. Para seguir, clique em "Mais
> informações" e depois em "Executar assim mesmo".

Para o Android, instalar um `.apk` fora da Play Store exige que o comprador
autorize "instalar de fontes desconhecidas" nas configurações do aparelho —
isso também precisa estar escrito antes da compra.

## O que escrever na página de venda (Kiwify)

Repetindo os limites já estabelecidos em `docs/comercial.md`, porque são os
mesmos, só que agora com um comprador real do outro lado:

1. **Os dados ficam só no aparelho** que instalou o app. Não há sincronização
   entre o computador e o celular, nem backup automático na nuvem. Se o
   comprador formatar o aparelho sem exportar os dados antes, eles se
   perdem — não há como recuperá-los depois.
2. **O arquivo pode ser compartilhado.** Como não há verificação de licença
   (deliberadamente — ver `docs/comercial.md`: "Não coloque validação de
   licença no frontend"), está vendendo confiança, não uma trava técnica.
3. **Atualizações não são automáticas.** Defina o canal (grupo, e-mail, área
   de membros da própria Kiwify) pelo qual novas versões serão avisadas, e
   cumpra esse canal.
4. **O aviso do SmartScreen** (Windows) e a necessidade de autorizar "fontes
   desconhecidas" (Android), como descrito acima.

## O que este projeto não faz, e por quê

- **Não verifica licença no frontend.** Validar isso no código do próprio
  aplicativo seria contornável em minutos (bastaria editar o arquivo
  instalado) e daria uma falsa sensação de controle — ver `docs/comercial.md`.
- **Não se conecta à Kiwify, nem a nenhum serviço de pagamento.** A venda,
  cobrança e entrega do arquivo são inteiramente responsabilidade da
  plataforma; o aplicativo não sabe, e não precisa saber, que uma compra
  aconteceu.
- **Não tem telemetria nem analytics.** Nenhum dado de uso sai do aparelho de
  quem compra, em nenhuma das duas plataformas.
