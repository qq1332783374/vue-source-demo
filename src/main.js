import Vue from 'vue'
import App from './App.vue'
import ComponentSourceDemo from './components/component-source-demo'

Vue.use(ComponentSourceDemo)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
