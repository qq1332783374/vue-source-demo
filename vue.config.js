const docsLoader = require.resolve('./plugins/docs-loader.js')

module.exports = {
    // 关闭 eslint
    lintOnSave: false,
    configureWebpack: {
        module: {
            rules: [
                {
                    resourceQuery: /blockType=docs/,
                    loader: docsLoader,
                }
            ]
        }
    }
}
