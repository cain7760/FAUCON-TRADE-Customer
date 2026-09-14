import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '../../theme-tokens.css'
import './theme.css'
import '../../semantic-colors.css'
import EquityDraft from './EquityDraft.vue'

createApp(EquityDraft).use(ElementPlus).mount('#app')
