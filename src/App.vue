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
