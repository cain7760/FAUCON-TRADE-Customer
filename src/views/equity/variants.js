import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './theme.css'
import './variants.css'
import EquityVariants from './EquityVariants.vue'

createApp(EquityVariants).use(ElementPlus).mount('#app')
