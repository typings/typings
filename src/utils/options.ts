export interface InstallOptions {
  ambient?: boolean
  save?: boolean
  saveAmbient?: boolean
  saveDev?: boolean
  saveAmbientDev?: boolean
}

/**
 * Check if installation options look "ambient".
 */
export function isAmbientInstall (options: InstallOptions): boolean {
  return options.ambient || (
    !options.save && !options.saveDev && (options.saveAmbient || options.saveAmbientDev)
  )
}
