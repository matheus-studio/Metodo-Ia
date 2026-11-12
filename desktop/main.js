// Processo principal do Método IA Pro em desktop (Electron).
//
// O aplicativo em si não muda: isto só abre uma janela nativa e carrega o
// mesmo build estático que roda no navegador (gerado por `npm run build:app`
// no projeto principal e copiado para `desktop/app/` antes do empacotamento).
//
// Superfície exposta ao conteúdo web: nenhuma. `contextIsolation: true` e
// `nodeIntegration: false` significam que a página não tem acesso a Node, ao
// sistema de arquivos ou a qualquer API do Electron além do que um navegador
// comum já oferece. Os dados continuam em IndexedDB, agora dentro da pasta de
// dados do usuário do sistema operacional — não em `localStorage` de um site,
// mas no mesmo mecanismo, só que isolado por aplicativo em vez de por domínio.
'use strict'

const { app, BrowserWindow, shell, protocol } = require('electron')
const path = require('node:path')

const APP_URL = 'app://local/index.html'

// Precisa ser chamado antes de `app.whenReady()`. Sem isto, módulos ES
// carregados por `app://` caem na mesma restrição de CORS que um `file://`
// aberto direto no navegador — foi assim que esse problema apareceu a
// primeira vez, testando o build fora do Electron.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

function registerAppProtocol() {
  const { protocol, net } = require('electron')
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    // `app://local/<caminho>` resolve para `app/<caminho>` dentro do pacote.
    // Impede que `../` escape da pasta do aplicativo.
    const relative = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.(\/|\\|$))+/, '')
    const filePath = path.join(__dirname, 'app', relative)
    if (!filePath.startsWith(path.join(__dirname, 'app'))) {
      return new Response('Recusado', { status: 403 })
    }
    return net.fetch(`file://${filePath}`)
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#080b10', // --graphite-950: evita flash branco antes do CSS carregar
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  win.loadURL(APP_URL)

  // Links que o aplicativo abre com target="_blank" (ex.: WhatsApp Web na
  // prospecção) vão para o navegador padrão do sistema, nunca para uma nova
  // janela do próprio Electron sem as proteções desta.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Navegação para fora do pacote do aplicativo é bloqueada — o conteúdo é
  // local e não deveria, em circunstância nenhuma, sair para a rede.
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://local/')) event.preventDefault()
  })
}

/**
 * Mesma política do `netlify.toml`/`vercel.json`: sem `unsafe-inline` em
 * `script-src`. Lá ela chega por cabeçalho HTTP; aqui não há servidor, então
 * é aplicada à resposta de cada arquivo servido pelo protocolo `app://`.
 */
function applyContentSecurityPolicy() {
  const { session } = require('electron')
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
        ],
      },
    })
  })
}

app.whenReady().then(() => {
  registerAppProtocol()
  applyContentSecurityPolicy()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
