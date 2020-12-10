import ComponentSourceDemo from './src/index'

ComponentSourceDemo.install = (Vue) => Vue.component(ComponentSourceDemo.name, ComponentSourceDemo)

export default ComponentSourceDemo
