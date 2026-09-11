<script setup>
import { computed, ref } from 'vue'
import { CircleClose, Close } from '@element-plus/icons-vue'
import ClientLineIcon from './ClientLineIcon.vue'
import SettingsMenuIcon from './SettingsMenuIcon.vue'
import OptionLifecycle from './views/option-lifecycle/OptionLifecycle.vue'

const showSettings = ref(false)
const activeSetting = ref('account')
const language = ref('简体中文')
const orderPrice = ref('最新价')
const colorRule = ref('red-up')
const theme = ref('dark')
const autoLaunch = ref(false)
const activeNav = ref('期权交易')
const settingMenu = [
  { key: 'account', label: '账号信息' },
  { key: 'language', label: '语言设置' },
  { key: 'trading', label: '交易与行情设置' },
  { key: 'appearance', label: '系统外观' },
]
const mainNav = [
  { label: '权益交易', icon: [['u76.svg', 0, 0, 14, 9], ['u77.svg', 0, 4, 14, 10]] },
  { label: '期权交易', icon: [['u83.svg', 0, 0, 13, 14], ['u84.svg', 7, 8, 6, 6]] },
  { label: '融资申请', icon: [['u90.svg', 2, 0, 10, 8], ['u91.svg', 0, 9, 14, 5]] },
  { label: '策略交易', icon: [['u100.svg', 0, 0, 12, 12], ['u101.svg', 3, 11, 7, 5]] },
  { label: '模拟交易', icon: [['u107.svg', 0, 0, 6, 7], ['u108.svg', 5, 0, 11, 15]] },
  { label: '数据', icon: [['u114.svg', 0, 0, 12, 13], ['u115.svg', 7, 6, 8, 8]] },
]
const sideGroups = [
  { label: '分组名称A', rows: ['全部成交数据', '全部成交数据', '全部成交数据', '全部成交数据'] },
  { label: '分组名称B', rows: ['全部成交数据', '全部成交数据'] },
]
const pricePreviewClass = computed(() => colorRule.value === 'green-up' ? 'reverse' : '')
function scrollToSetting(key) {
  activeSetting.value = key
  document.getElementById(`${key}-setting`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function saveSettings() { showSettings.value = false }
</script>

<template>
  <main class="client-shell" :class="{ 'light-theme': theme === 'light' }">
    <header class="topbar">
      <img class="brand-image" src="/original-icons/logo-header.png" alt="FAUCON TRADE" />
      <nav class="main-nav">
        <button v-for="item in mainNav" :key="item.label" :class="{ active: activeNav === item.label }" @click="activeNav = item.label">
          <span class="source-composite nav-icon" aria-hidden="true"><img v-for="part in item.icon" :key="part[0]" :src="`/original-icons/${part[0]}`" :style="{ left: `${part[1]}px`, top: `${part[2]}px`, width: `${part[3]}px`, height: `${part[4]}px` }" alt="" /></span>{{ item.label }}
        </button>
      </nav>
      <div class="top-actions">
        <div class="system-notice"><span class="notice-speaker">⌁</span><b>系统通知：</b><span>尊敬的客户，您好，我们系统于2026年8月27日晚上23:00</span><span>×</span></div>
        <button class="icon-action" aria-label="消息"><ClientLineIcon class="top-line-icon" type="bell" /></button>
        <div class="avatar">Ke</div><button class="account">Kevin Zhang <img class="source-icon caret-icon" src="/original-icons/u133.svg" alt="" /></button>
        <i class="window-divider" /><button class="window-action" aria-label="最小化"><ClientLineIcon class="window-line-icon" type="minimize" /></button><button class="window-action" aria-label="最大化"><ClientLineIcon class="window-line-icon" type="maximize" /></button><button class="window-action" aria-label="关闭"><ClientLineIcon class="window-line-icon" type="close" /></button>
      </div>
    </header>

    <section class="workspace">
      <aside class="rail">
        <button class="rail-item active"><ClientLineIcon class="rail-icon rail-line-icon" type="inquiry" /><span>询价</span></button>
        <button class="rail-item"><ClientLineIcon class="rail-icon rail-line-icon" type="order" /><span>委托</span></button>
        <button class="rail-item"><ClientLineIcon class="rail-icon rail-line-icon" type="position" /><span>持仓</span></button>
        <div class="rail-bottom"><i /><button class="rail-control"><img class="source-icon rail-control-icon" src="/original-icons/u30.svg" alt="" /></button><button class="rail-control" @click="showSettings = true"><img class="source-icon rail-control-icon" src="/original-icons/u34.svg" alt="" /></button></div>
      </aside>
      <aside class="sidebar">
        <div class="sidebar-title">数据中心 <span class="sidebar-collapse">≪</span></div>
        <el-scrollbar class="sidebar-scroll"><div v-for="group in sideGroups" :key="group.label" class="side-group"><small>{{ group.label }}</small><button v-for="(row,index) in group.rows" :key="index" :class="{ selected: group.label === '分组名称A' && index === 0 }"><el-icon><CircleClose /></el-icon>{{ row }}</button></div></el-scrollbar>
      </aside>
      <section class="content"><OptionLifecycle /></section>
    </section>
    <footer class="statusbar"><span class="online-dot" /> 服务：CW_UAT　 系统版本：V2026.0.11.12 <time>2025-11-27 14:22:45 UTC+8</time></footer>
  </main>

  <el-dialog v-model="showSettings" class="settings-dialog" width="700px" :show-close="false" :close-on-click-modal="true" destroy-on-close>
    <template #header><div class="settings-title"><h2>系统设置</h2><button @click="showSettings = false"><el-icon><Close /></el-icon></button></div></template>
    <div class="settings-layout">
      <nav class="settings-nav"><button v-for="item in settingMenu" :key="item.key" :class="{ active: activeSetting === item.key }" @click="scrollToSetting(item.key)"><SettingsMenuIcon :name="item.key" />{{ item.label }}</button></nav>
      <el-scrollbar class="settings-content">
        <section id="account-setting" class="settings-section"><h3>账号信息</h3><div class="setting-row"><span>登录密码</span><el-button plain>修改密码</el-button></div><div class="setting-row"><span>开机启动</span><el-switch v-model="autoLaunch" /></div></section>
        <section id="language-setting" class="settings-section"><h3>语言设置</h3><div class="setting-row"><span>显示语言</span><el-radio-group v-model="language" class="settings-radio-group"><el-radio class="settings-radio" label="简体中文">简体中文</el-radio><el-radio class="settings-radio" label="繁體中文">繁體中文</el-radio><el-radio class="settings-radio" label="English">English</el-radio></el-radio-group></div></section>
        <section id="trading-setting" class="settings-section"><h3>交易与行情设置</h3><div class="setting-row"><span>委托价设置</span><el-radio-group v-model="orderPrice" class="settings-radio-group"><el-radio class="settings-radio" label="买一">买一</el-radio><el-radio class="settings-radio" label="卖一">卖一</el-radio><el-radio class="settings-radio" label="最新价">最新价</el-radio></el-radio-group></div><div class="setting-row"><span>涨跌幅颜色</span><el-radio-group v-model="colorRule" class="settings-radio-group"><el-radio class="settings-radio" label="red-up">红涨绿跌</el-radio><el-radio class="settings-radio" label="green-up">绿涨红跌</el-radio></el-radio-group></div><div class="price-preview" :class="pricePreviewClass"><span class="up">↑ 2.48%</span><span class="down">↓ 1.36%</span></div></section>
        <section id="appearance-setting" class="settings-section"><h3>系统外观</h3><div class="setting-row"><span>主题模式</span><el-radio-group v-model="theme" class="settings-radio-group"><el-radio class="settings-radio" label="dark">深色模式</el-radio><el-radio class="settings-radio" label="light">浅色模式</el-radio></el-radio-group></div><div class="theme-cards"><button :class="{ selected: theme === 'dark' }" @click="theme = 'dark'"><span class="mini-screen dark"><i /><b /><em /><em /><em /></span>深色模式</button><button :class="{ selected: theme === 'light' }" @click="theme = 'light'"><span class="mini-screen light"><i /><b /><em /><em /><em /></span>浅色模式</button></div></section>
      </el-scrollbar>
    </div>
    <template #footer><div class="settings-footer"><el-button @click="showSettings = false">取 消</el-button><el-button type="primary" @click="saveSettings">保存设置</el-button></div></template>
  </el-dialog>
</template>
