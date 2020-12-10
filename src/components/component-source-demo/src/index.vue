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
