# 自定义 `loader` 读取 `*.vue` 文件源码

相关依赖版本：

- `node v10.15.0`
- `npm v6.4.1`
- `yarn v1.22.10`
- `vue-cli v4.5.9`
- `@vue/compiler v3.0.4`



## 1. 前言（需求）

就是想读取 `*.vue` 文件的源码并高亮展示到页面上，又不想用第三方的依赖（其实是找不到）。



## 2. 实现思路

通过  [vue-loader 自定义块](https://vue-loader.vuejs.org/zh/guide/custom-blocks.html) 功能，获取目标文件的文件路径，然后通过 `fs` 读取源码，再用 [@vue/compiler-core](https://github.com/vuejs/vue-next/tree/master/packages/compiler-core#readme) 的 API `baseParse`将读取到的内容转换成 `AST` 语法抽象树，然后将 `fs` 读取的内容中 抽离出 自定义块内容 和 需要的源码，最后再将以上两个内容重新挂到组件对象上，直接读取组件相应的字段就可以。

完美，关机，下班。



## 3. 实现

现在思路已经非常的清晰，时候实现它了。



### 3.1 项目初始化

`vue-cli` 创建快速模板搭建项目，这里用的是 2版本的 vue，后面再用 `vite` + `vue3` 实现一个。

![image-20201210225929248](http://image.tanshangbiao.cn/image-20201210225929248.png)

项目跑起来是下面这个样子的，这里大家应该都会的，就不多赘述了。

![image-20201210231214294](http://image.tanshangbiao.cn/image-20201210231214294.png)

### 3.2 自定义块

这里参考  [vue-loader](https://vue-loader.vuejs.org/zh/guide/custom-blocks.html) 官网的例子，非常的简单。不懂的同学，可以去官网查看。

1. 创建`loader`文件 `plugins/docs-loader.js`

```javascript
module.exports = function (source, map) {
    this.callback(
        null,
        `export default function (Component) {
            Component.options.__docs = ${
                JSON.stringify(source)
            }
        }`,
        map
    )
}
```



2. 创建 `vue.config.js` 配置规则使用上面定义好的 `loader`

```javascript
const docsLoader = require.resolve('./plugins/docs-loader.js')

module.exports = {
    configureWebpack: {
        module: {
            rules: [
                {
                    resourceQuery: /blockType=docs/,
                    loader: docsLoader
                }
            ]
        }
    }
}

```

​	注：修改了配置相关文件需要重跑一下项目



3. 使用

`src/components/demo.vue`

```html
<docs>
    我是ComponentB docs自定义快 内容
</docs>

<template>
    <div>
        ComponentB 组件
    </div>
</template>

<script>
    export default {
        name: "ComponentB"
    }
</script>

<style scoped>

</style>
```



`src/App.vue`

```html
<template>
    <div id="app">
        <demo/>
        <p>{{demoDocs}}</p>
    </div>
</template>

<script>
    import Demo from './components/demo'

    export default {
        name: 'App',
        components: {
            Demo
        },
        data () {
            return {
                demoDocs: Demo.__docs
            }
        }
    }
</script>

```



效果：

![image-20201210232732127](http://image.tanshangbiao.cn/image-20201210232732127.png)

将 `Demo` 组件在控制台输出效果会更明显一点：

![image-20201210232901114](http://image.tanshangbiao.cn/image-20201210232901114.png)



### 3.4 获取文件路径并显示内容

在获取文件的路径的时候，瞎泽腾了好久（此处省略好多个字），结果 [webpack](https://webpack.js.org/contribute/writing-a-loader/) 的英文官网是有提到。于是就去打印一下 `loader` 的 `this` ，真的什么都有，早知道早点打印出来看了，害！！！ 留下了没技术的眼泪。

![image-20201210234040621](http://image.tanshangbiao.cn/image-20201210234040621.png)



现在已经拿到目标文件的完整路径了，开始搞事情！给我们自定义的 `loader` 稍微加一点细节：

搞事前需要安装一下相关依赖：

```
yarn add -D @vue/compiler-core
```



```js
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
    // 5. 将 <docs></docs> 标签和内容抽离
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

```

完成以上步骤，记得重跑项目。现在我们来看看效果如何：

![image-20201210235104113](http://image.tanshangbiao.cn/image-20201210235104113.png)

em... 不错，`Demo` 组件该有的都有了。再用 `pre` 标签显示出来看：

![image-20201210235401173](http://image.tanshangbiao.cn/image-20201210235401173.png)

```html
<template>
    <div id="app">
        <demo/>
        <p>{{sourceCodeTitle}}</p>
        <pre v-text="sourceCode"></pre>
    </div>
</template>

<script>
    import Demo from './components/demo'

    export default {
        name: 'App',
        components: {
            Demo
        },
        data () {
            return {
                sourceCodeTitle: Demo.__sourceCodeTitle,
                sourceCode: Demo.__sourceCode
            }
        },
        mounted() {
            console.log('Demo', Demo)
        }
    }
</script>

```



到这里需求好像已经全部实现，很是轻松，作为一个刚毕业五个月的干饭人怎么能止步在这里呢！我决定让这平平无奇的代码高亮起来，让他变得漂漂亮亮的。



### 3.5 代码高亮

代码高亮用了一个 `star` 比较高的 [highlightjs](https://highlightjs.org/)。

安装：

```
yarn add highlight.js
```



使用：

`src/App.vue`

```html
<template>
    <div id="app">
        <demo/>
        <p>{{sourceCodeTitle}}</p>
        <pre>
            <code class="language-html" ref="code" v-text="sourceCode" />
        </pre>
    </div>
</template>

<script>
    import Demo from './components/demo'
    import highlightjs from 'highlight.js'
    import 'highlight.js/styles/vs2015.css'

    export default {
        name: 'App',
        components: {
            Demo
        },
        data () {
            return {
                sourceCodeTitle: Demo.__sourceCodeTitle,
                sourceCode: Demo.__sourceCode
            }
        },
        async mounted() {
            await this.$nextTick()
            this.init()
        },
        methods: {
            init () {
                const codeEl = this.$refs.code
                highlightjs.highlightBlock(codeEl)
            }
        }
    }
</script>

```

效果：

![image-20201211001635863](http://image.tanshangbiao.cn/image-20201211001635863.png)

代码高亮了，是喜欢的颜色。亮是亮起来了，但是写得是一次性代码，不大符合干饭人的要求，是不是可以封装一个公共组件专门来看组件的效果和源码的呢！



### 3.6 组件封装

封装组件之前需要构思一下这个组件应该长什么样呢？带着样的一个疑问，去浏览了各个优秀轮子的文档页面，画出了下面的设计图：

![image-20201211002904439](http://image.tanshangbiao.cn/image-20201211002904439.png)

开始全局组件封装：

1. `src/components/component-source-demo/src/index.vue`

   ```html
   <template>
       <div class="component-source-demo">
           <h2 class="component-source-demo__title">{{title || component.__sourceCodeTitle}}</h2>
           <div class="component-source-demo__description">{{description}}</div>
           <div class="component-source-demo__component">
               <component :is="component" :key="component.__sourceCodeTitle"/>
           </div>
           <div class="component-source-demo__action">
               <button type="button" @click="handleCodeVisible('hide')" v-if="codeVisible">隐藏代码 ↑</button>
               <button type="button" @click="handleCodeVisible('show')" v-else>查看代码 ↓</button>
           </div>
           <div class="component-source-demo__code" v-show="codeVisible">
         <pre>
           <code class="html" ref="code" v-text="component.__sourceCode"/>
         </pre>
           </div>
       </div>
   </template>
   
   <script>
       import {highlightBlock} from 'highlight.js';
       import 'highlight.js/styles/vs2015.css'
   
       export default {
           name: "component-source-demo",
           props: {
               title: String,
               description: String,
               component: {
                   type: Object,
                   required: true
               }
           },
           data() {
               return {
                   codeVisible: true
               }
           },
           async mounted() {
               await this.$nextTick()
               this.init()
           },
           methods: {
               init () {
                   const codeEl = this.$refs.code
                   highlightBlock(codeEl)
               },
               handleCodeVisible(status) {
                   this.codeVisible = status === 'show'
               }
           }
       }
   </script>
   
   <style scoped>
   
   </style>
   
   ```

   

2. `src/components/component-source-demo/index.js`

   ```javascript
   import ComponentSourceDemo from './src/index'
   
   ComponentSourceDemo.install = (Vue) => Vue.component(ComponentSourceDemo.name, ComponentSourceDemo)
   
   export default ComponentSourceDemo
   
   ```



使用：

1. `src/mian.js` 全局注册组件

   ![image-20201211004750178](http://image.tanshangbiao.cn/image-20201211004750178.png)

2. `src/App.vue`

   ```html
   <template>
       <div id="app">
           <component-source-demo :component="Demo"/>
       </div>
   </template>
   
   <script>
       import Demo from './components/demo'
   
       export default {
           name: 'App',
           data () {
               return {
                   Demo
               }
           }
       }
   </script>
   
   ```

   代码非常的清爽，舒服！！！ 效果也非常的棒，甲方很满意。

   ![03](http://image.tanshangbiao.cn/03.gif)

   感觉还是有点美中不足，如果有很多个需要展示的组件呢。那岂不是要写很多的重复代码，作为优秀的干饭人是不允许这种情况出现的，代码还需再优化一下。



### 3.7 代码优化



#### 3.7.1 组件自动引入

`src/App.vue`

```html
<template>
    <div id="app">
        <component-source-demo
                v-for="item in componentList"
                :key="item.name"
                :component="item"
        />
    </div>
</template>

<script>
    export default {
        name: 'App',
        data () {
            return {
                componentList: []
            }
        },
        mounted() {
            this.autoImportComponents()
        },
        methods: {
            autoImportComponents () {
                const moduleList = require.context('./components/demo', false, /\.vue$/)
                const requireAll = requireContext => requireContext.keys().map(requireContext)
                let targetModuleList = requireAll(moduleList)
                this.componentList = targetModuleList.map(module => {
                    return module.default
                })
            }
        }
    }
</script>

```



![image-20201211012252290](http://image.tanshangbiao.cn/image-20201211012252290.png)

![image-20201211012523830](http://image.tanshangbiao.cn/image-20201211012523830.png)

现在只需往 `components/demo` 添加的新的组件，我们只需刷新一下`webpack` 就会帮我们自动读取组件了。



## 4. 总结

到这里基本完工了，很多的知识点都是现学现卖的，如果哪里讲的不对希望大家指出，哪里讲得不好希望大家多多包涵。

在这里需要感谢 [方应杭 ](https://juejin.cn/user/2330620350186350) 方方老师提供的思路。