#!/usr/bin/env bash
# Gera, UMA vez, a chave que assina o APK do Método IA Pro.
#
# Guarde o arquivo .keystore e a senha em lugar seguro (gerenciador de senhas +
# um backup fora do computador). Se perder a chave, não dá mais para atualizar
# o app de quem já instalou: só lançando como um app novo.
# NUNCA coloque o .keystore no repositório nem no ZIP de entrega.
set -euo pipefail

KEYSTORE="${1:-metodo-ia-pro.keystore}"
ALIAS="metodo-ia-pro"

if [ -e "$KEYSTORE" ]; then
  echo "Já existe $KEYSTORE — não vou sobrescrever." >&2
  exit 1
fi

read -r -s -p "Escolha uma senha para a chave (mín. 8 caracteres): " PASS; echo
[ "${#PASS}" -ge 8 ] || { echo "Senha curta demais." >&2; exit 1; }

keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" \
  -dname "CN=Metodo IA Pro, O=Metodo IA Pro, C=BR"

echo
echo "Chave criada: $KEYSTORE"
echo
echo "Para o GitHub Actions, cadastre estes 3 secrets (Settings > Secrets and variables > Actions):"
echo "  MIA_KEYSTORE_BASE64   = (conteúdo abaixo)"
echo "  MIA_KEYSTORE_PASSWORD = a senha que você acabou de digitar"
echo "  MIA_KEY_ALIAS         = $ALIAS"
echo
echo "----- MIA_KEYSTORE_BASE64 -----"
base64 -w0 "$KEYSTORE" 2>/dev/null || base64 "$KEYSTORE" | tr -d '\n'
echo
