const fs = require('fs');
const {baseParse} = require('@vue/compiler-core');

module.exports = function (source, map) {
    // 1. 获取带有 <docs /> 标签的文件完整路径
    const {resourcePath} = this
    // 2. 读取文件内容
    const file = fs.readFileSync(resourcePath).toString()
    // 3. 通过 baseParse 将字符串模板转换成 AST 抽象语法树
    const parsed = baseParse(file).children.find(n => n.tag === 'docs')
    // 4. 标题
    const title = parsed.children[0].content
    // 5. 源码里带有 docs 标签截取出来，保留主要的代码部分
    const main = file.split(parsed.loc.source).join('').trim()
    // 6. 回到并添加到 组件对象上面
    this.callback(
        null,
        `export default function (Component) {
          Component.options.__sourceCode = ${JSON.stringify(main)}
          Component.options.__sourceCodeTitle = ${JSON.stringify(title)}
        }`,
        map
    )
}
