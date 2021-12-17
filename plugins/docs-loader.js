const fs = require('fs');
const { parse } = require('@vue/compiler-sfc');

const sourceType = ['template', 'script', 'styles']

const handlerSource = (source) => {
    if (!source) {
        return
    }
    let sourceStr = ''
    sourceType.forEach(typeItem => {
        if (source[typeItem] && !Array.isArray(source[typeItem])) {
            sourceStr += `<${typeItem}>${source[typeItem].content}<\/${typeItem}>\n\n`
        }
        if (Array.isArray(source[typeItem])) {
            sourceStr += source[typeItem].map(
              sourceItem => `<${sourceItem.type}>${sourceItem.content}<\/${sourceItem.type}>\n\n`
            ).join('')
        }
    })
    return sourceStr
}

/**
 * 原来用 @vue/compiler-core 里面 baseParse方法 进行 AST 转换的
 * 但是遇到了一个 bug，就是在js里面用 大于> 或 小于< 号的时候 会报如下错误：
 * Syntax Error: SyntaxError: Illegal tag name. Use '&lt;' to print '<'.
 * 搜寻了一番没找到具体为啥，搞得也不是很明白
 * 盲猜 baseParse方法 是用于解析标签的，但是遇上了 大于小于号，由于没有成功闭合标签所以报错了。
 * ... ...
 * 想到另外一个依赖 @vue/compiler-sfc 也是用来解析*.vue文件的
 * 于是就尝试一下，发现没有报错，就是结果有点不一样 简单处理一下就可以了
 * @updateBy 谭上彪
 * @date 2021年12月17日14:41:33
 * @param source
 * @param map
 */
module.exports = function (source, map) {
    // 1. 获取带有 <docs /> 标签的文件完整路径
    const {resourcePath} = this
    // 2. 2. 读取文件内容
    const file = fs.readFileSync(resourcePath).toString()
    // 3. 利用
    const parsed = parse(file).descriptor
    // 3. 源码转换
    const sourceCode = handlerSource(parsed)
    const sourceCodeTitle = parsed.customBlocks[0].content
    // 4. 将结果添加到 组件对象上面
    this.callback(
        null,
        `export default function (Component) {
          Component.options.__sourceCode = ${JSON.stringify(sourceCode)}
          Component.options.__sourceCodeTitle = ${JSON.stringify(sourceCodeTitle)}
        }`,
        map
    )
}
