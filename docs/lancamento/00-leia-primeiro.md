# Lançamento do Método IA Pro — por onde começar

Atualizado em 13/11/2026 · Produto: versão 0.5.0

## A decisão que mudou o plano

Instaladores soltos (`.exe`, `.apk`) mostram avisos de "app não seguro" e, no
**Brasil**, desde **30/09/2026** celulares Android certificados **bloqueiam a
instalação normal de apps de desenvolvedores não registrados no Google**
([fonte](https://developer.android.com/developer-verification)). Para comprador
comum isso é um bloqueio, não um aviso. Por isso o produto principal passou a
ser a **versão web instalável (PWA)**:

- O comprador abre um link e toca em **Instalar** / **Adicionar à tela inicial**. O ícone fica no aparelho e abre como app, em tela cheia, **sem internet** depois de instalado.
- **Nenhum aviso de segurança**, nenhuma conta em loja, nenhum certificado.
- **Um único produto para tudo:** Android, iPhone, Windows, Mac e Linux.

## Estado por plataforma

| Caminho | Estado | Observação |
| --- | --- | --- |
| **Versão web instalável (PWA)** | Pronta e testada em navegador real (instalável, abre sem internet com os dados salvos, atualiza com segurança). Falta publicar num endereço (`05-publicar-pwa.md`). | **Produto principal.** Não testada num celular físico ainda. |
| Windows (`.exe`) | Pronto. | Opcional: terá o aviso do SmartScreen. |
| Linux (AppImage) | Pronto. | Opcional. |
| Android (`.apk`) | Pipeline funciona (APK de teste gerado). | **Não venda:** o Google bloqueia no Brasil sem registro de desenvolvedor (US$ 25 + identidade). Só faz sentido depois disso. |
| Google Play | Não feito. | Caminho oficial para Android (US$ 25; conta pessoal nova exige teste fechado com 12 pessoas por 14 dias). Dá para fazer em paralelo. |

## Ordem sugerida

1. **Publicar a versão web** (`05-publicar-pwa.md`, uns 10 minutos para o primeiro teste).
2. **Instalar no seu celular** e conferir: instala, abre sem internet, um cadastro no CRM sobrevive a fechar e reabrir, exportar backup abre a janela de compartilhar/baixar.
3. **Decidir o endereço definitivo e o controle de acesso** (ver "Limite importante" abaixo).
4. **Criar o produto** na Kiwify/Cakto com o texto de `01-pagina-de-venda.md`; a entrega é o **link** da versão web + o guia de `02-guia-do-comprador.md`.
5. **Compra de teste** e seguir o guia como cliente.
6. Só então divulgar.

## Limite importante: quem tem o link, usa

A versão web funciona para qualquer pessoa que receber o endereço. Isso é
igual a qualquer arquivo vendido que o comprador possa repassar, mas aqui é
mais fácil de repassar. Opções, da mais simples:

- **Endereço não divulgado**, entregue só depois do pagamento. Simples; o comprador pode compartilhar.
- **Acesso por comprador**: um pequeno servidor recebe o aviso de compra da plataforma e libera um acesso individual, que pode ser cancelado. É trabalho extra e exige hospedagem com servidor. Posso fazer depois se as vendas justificarem.
- Não coloque "validação de licença" dentro do próprio app: seria contornável em minutos (ver `docs/comercial.md`).

## O que continua valendo

Limites que precisam estar na página de venda (já no texto pronto): dados só
no aparelho (sem sincronizar), a IA não vem embutida (o app monta prompts; você
usa a IA que já tem), a busca automática de empresas ainda não existe, sem
promessa de faturamento.

## Outros materiais desta pasta

- `01-pagina-de-venda.md` — texto do anúncio
- `02-guia-do-comprador.md` — instalação por aparelho
- `03-termos-e-politicas.md` — modelo de termos, privacidade e reembolso (revisar com advogado)
- `04-android-ci.md` — gerar o APK (só se for seguir o caminho do APK/Play)
- `05-publicar-pwa.md` — publicar a versão web
