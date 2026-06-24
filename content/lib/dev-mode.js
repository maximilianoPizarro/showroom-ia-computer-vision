'use strict'

module.exports.register = function ({ config }) {
  if (!config.enabled) return
  this.on('contentClassified', ({ contentCatalog }) => {
    contentCatalog.getComponents().forEach(({ ascidoc, versions }) => {
      versions.forEach(({ modules }) => {
        modules.forEach((module) => {
          module.files.forEach((file) => {
            if (file.stem === 'nav') return
            file.asciidoc = file.asciidoc || {}
            file.asciidoc.attributes = file.asciidoc.attributes || {}
            file.asciidoc.attributes['page-dev-mode'] = true
          })
        })
      })
    })
  })
}
