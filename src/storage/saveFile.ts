// Entrega um arquivo gerado no aparelho (hoje: o backup em JSON) ao usuário.
//
// No navegador e no Electron, `<a download>` funciona. Na WebView do Android
// ele não: o clique é ignorado em silêncio. Lá o arquivo é gravado no cache do
// aplicativo e a folha de compartilhamento do sistema abre para o usuário
// escolher onde guardar (Drive, Arquivos, WhatsApp, e-mail…).
//
// Os plugins nativos entram por `import()` dinâmico: ficam fora do carregamento
// inicial e nem são baixados no navegador/desktop.

export type SaveResult = 'baixado' | 'compartilhado'

async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function downloadInBrowser(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function saveTextFile(filename: string, content: string, mime = 'application/json'): Promise<SaveResult> {
  if (!(await isNativeApp())) {
    downloadInBrowser(filename, content, mime)
    return 'baixado'
  }

  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ])
  const written = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({
    title: filename,
    dialogTitle: 'Guardar backup',
    url: written.uri,
  })
  return 'compartilhado'
}
