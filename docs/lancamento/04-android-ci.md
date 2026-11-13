# Gerar o APK do Android (uma vez, ~30 min)

Precisa de uma conta gratuita no GitHub. O Android só pode ser compilado em
uma máquina com acesso normal à internet; o GitHub Actions faz isso de graça
para repositórios (confira a franquia de minutos do seu plano).

## 1. Gerar a chave de assinatura (uma única vez na vida do app)

Num computador com Java instalado (`keytool`), na pasta do projeto:

```bash
./scripts/gerar-chave-android.sh
```

Ele pede uma senha, cria `metodo-ia-pro.keystore` e imprime três valores.

**Guarde o arquivo `.keystore` e a senha em dois lugares seguros** (ex.:
gerenciador de senhas e um pendrive/nuvem privada). Perdeu a chave = não dá
mais para atualizar o app de quem já instalou. Nunca suba o `.keystore` para o
GitHub nem coloque no ZIP.

## 2. Subir o projeto para um repositório **privado** no GitHub

Crie o repositório (privado) e envie o conteúdo do projeto (o ZIP, sem
`node_modules`).

## 3. Cadastrar os 3 segredos

No repositório: Settings → Secrets and variables → Actions → New repository secret.

| Nome | Valor |
| --- | --- |
| `MIA_KEYSTORE_BASE64` | o texto longo que o script imprimiu |
| `MIA_KEYSTORE_PASSWORD` | a senha que você digitou |
| `MIA_KEY_ALIAS` | `metodo-ia-pro` |

## 3.1 Atalho para o primeiro teste (sem segredos)

Se você rodar o pipeline **sem** cadastrar os segredos, ele gera um APK de
**teste**, nome terminado em `-TESTE.apk`, com uma chave descartável. Serve
para instalar e conferir o app no celular. **Não venda esse arquivo:** a chave
some ao fim da execução, então o APK de venda (com a chave de verdade) não
instala por cima dele; quem tem o de teste precisa desinstalar antes.

## 4. Rodar

**Mais fácil:** depois de cadastrar os segredos, me avise e eu disparo o
pipeline (envio o projeto para o ramo `release`).

**Você mesmo:** aba **Actions** → **Gerar instaladores** → **Run workflow**. No
celular esse botão só aparece em "Site para computador". Leva alguns minutos.
No fim, a página da execução mostra **Artifacts**: `android-apk`, `windows`,
`linux`. Baixe, descompacte.

O pipeline falha de propósito se faltar o segredo da chave ou se o APK sair
sem assinatura válida.

**Aviso honesto:** esse pipeline foi escrito e conferido (sintaxe), mas **nunca
foi executado** — eu não tenho acesso ao GitHub daqui. Se a primeira execução
falhar, copie a mensagem de erro do passo vermelho e me mande; costuma ser
ajuste pequeno.

## 5. Testar no celular

Copie o `.apk` para um Android, abra e autorize "instalar de fontes
desconhecidas" quando o sistema pedir. Confira: abre; cadastra um contato no
CRM; fecha o app e reabre (o contato continua lá); Configurações → Exportar
backup abre a janela de compartilhar.
