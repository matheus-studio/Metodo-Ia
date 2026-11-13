# Lançamento do Método IA Pro — por onde começar

Atualizado em 13/11/2026 · Produto: versão 0.5.0

## Decisão: vender o aplicativo baixável

O comprador recebe os arquivos de instalação (Android, Windows, Linux) e
instala. Sem conta, sem servidor, pagamento único.

A versão web instalável (PWA) continua dentro do app e pode ser publicada se um
dia fizer sentido (`05-publicar-pwa.md`), mas **não é o produto vendido** e hoje
está desligada (o publicador só roda manualmente).

## Estado por plataforma

| Plataforma | Estado | Falta |
| --- | --- | --- |
| **Windows** | Pronto (`.exe`). Abre e carrega num ambiente simulado. | Testar uma instalação num Windows real. Terá o aviso azul do SmartScreen (explicado no guia). |
| **Linux** | Pronto (AppImage). Abre e carrega. | Teste numa máquina real, se quiser. |
| **Android** | Pipeline funciona; um APK **de teste** foi gerado e instalou no seu celular. | **APK de venda**, com a chave definitiva (`04-android-ci.md`). |
| iPhone / Mac | Não incluído. | Exigem conta Apple paga e um Mac. A versão web instalável (PWA) é a alternativa, se um dia quiser. |

## Risco conhecido do Android (acompanhe)

O Google passou a exigir que desenvolvedores se **registrem** (US$ 25 e
identidade) para que apps instalados fora da Play Store não sejam barrados em
celulares certificados; o marco anunciado para o **Brasil é 30/09/2026**
([fonte](https://developer.android.com/developer-verification)). A página oficial
não explica o que um comprador comum vê ao instalar um app não registrado
(só cita um "fluxo avançado" para usuários experientes). No seu celular o APK
de teste instalou pedindo apenas permissão, mas **um celular não prova o que
acontece nos dos compradores**: a regra está em implantação e pode variar por
marca e versão do Android.

O que fazer: **teste o APK em pelo menos 2 celulares diferentes** (marca e
versão do Android diferentes). Se algum barrar, o caminho é o registro no
Google; avise-me que eu preparo o que for possível do lado do projeto.

## Ordem sugerida

1. **Passar o repositório para privado** (Settings → General → Danger Zone → Change repository visibility). O link da versão web, hoje aberto, sai do ar.
2. **Gerar a chave definitiva do Android e cadastrar os 3 segredos** (`04-android-ci.md`). Depois me avise: eu publico o APK de venda.
3. **Testar** o APK em 2 celulares, o `.exe` num Windows real. Conferir: abre, cadastra no CRM, fecha e reabre com os dados, e **exportar backup** (no Android abre a janela de compartilhar; foi escrito mas não foi testado em aparelho).
4. **Decidir preço e plataforma de venda** (Kiwify, Cakto, Hotmart…).
5. **Hospedar os arquivos** (ver abaixo) e criar o produto com o texto de `01-pagina-de-venda.md`.
6. **Compra de teste** do seu próprio produto, seguindo o guia como cliente.
7. Só então divulgar.

## Como entregar os arquivos

O comprador precisa de **links de download** (os arquivos têm de 100 a 130 MB no desktop; o APK é pequeno). Opções:

- **Link externo** na mensagem de entrega: você sobe em Google Drive/Dropbox e cola os links. Sem limite da plataforma, mas **o link pode ser repassado** (vale para qualquer arquivo vendido). Prefira links "qualquer pessoa com o link".
- **Enviar os arquivos para a própria plataforma**, se ela aceitar esse tamanho. Confira o limite no seu painel; não verifiquei.

Não coloque "validação de licença" no app: seria contornável em minutos (ver `docs/comercial.md`).

## Limites que precisam estar na página de venda

Já estão no texto pronto: sem iPhone/Mac, dados só no aparelho (sem sincronizar), a IA não vem embutida, a busca automática de empresas ainda não existe, aviso do Windows, instalar APK fora da Play Store, sem promessa de faturamento.

## Outros materiais desta pasta

- `01-pagina-de-venda.md` — texto do anúncio
- `02-guia-do-comprador.md` — instalação por aparelho
- `03-termos-e-politicas.md` — modelo de termos, privacidade e reembolso (revisar com advogado)
- `04-android-ci.md` — gerar o APK de venda
- `05-publicar-pwa.md` — publicar a versão web (opcional)
