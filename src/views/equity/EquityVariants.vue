<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDownBold, Bell, CaretBottom, ChatDotRound, Search, Document, Setting, InfoFilled, Download, View, Hide, Clock, CircleCheck, CircleClose, Close, EditPen, List, More } from '@element-plus/icons-vue'
import ClientLineIcon from '../../ClientLineIcon.vue'
import SettingsMenuIcon from '../../SettingsMenuIcon.vue'
import { accounts } from './fixtures'
import { marketInstruments, variantRows, variants, money, number } from './variantData'
import { useTicketDock } from './useTicketDock'
import OrderTicket from './components/OrderTicket.vue'
import OrderBook from './components/OrderBook.vue'
import SortHeader from './components/SortHeader.vue'
import ColumnConfigPopover from './components/ColumnConfigPopover.vue'
import TradingTable from './components/TradingTable.vue'

const initialVariant = new URLSearchParams(location.search).get('layout')
const assetUrl = name => `${import.meta.env.BASE_URL}original-icons/${name}`
const variant = ref(variants.some(v => v.id === initialVariant) ? initialVariant : 'classic')
const activeNav = ref('权益交易')
const viewportWidth = ref(window.innerWidth)
const messageCenterVisible = ref(false)
const messageCategory = ref('全部')
const expandedMessageIds = ref([])
const headerNoticeKey = 'faucon-header-notice-dismissed-v2'
const showHeaderNotice = ref(true)
const systemNoticeEnabled = ref(true)
const showUnreadBadge = ref(true)
const settingsVisible = ref(false)
const activeSetting = ref('account')
const language = ref('简体中文')
const orderPrice = ref('最新价')
const colorRule = ref('red-up')
const theme = ref('dark')
const autoLaunch = ref(false)
const emergencyMessage = ref(null)
const headerNotice = {
  id: 'system-maintenance-20260911',
  text: '尊敬的客户，您好。交易系统将于 2026 年 9 月 14 日 02:00—04:00 进行例行维护，期间部分查询服务可能短暂不可用。',
}
const messages = ref([
  { id: 1, category: '通知', title: '系统例行维护通知', content: '交易系统将于 9 月 14 日 02:00—04:00 进行例行维护。维护期间，委托查询、资金查询及部分行情服务可能出现短暂延迟，请提前安排交易并关注后续系统通知。若您有未完成的委托，请在维护窗口开始前确认其状态；维护结束后系统会自动恢复服务，无需重复提交。', time: '今天 10:20', unread: true },
  { id: 2, category: '待办', title: '请完成适当性评估更新', content: '您的专业投资者适当性资料将在 30 天后到期，请在到期前完成更新，以免影响相关交易权限的正常使用。', time: '今天 09:15', unread: true },
  { id: 3, category: '消息', title: '委托已全部成交', content: '平安银行（000001）买入委托已全部成交，成交均价 11.78 CNY。', time: '昨天 14:38', unread: true },
  { id: 4, category: '通知', title: '账户资金划转完成', content: '资金划转申请已处理完成，到账金额 100,000.00 CNY。', time: '昨天 11:06', unread: false },
  { id: 5, category: '待办', title: '风险测评即将到期', content: '您的风险承受能力测评将在 2026 年 10 月 8 日到期。', time: '09-09 16:30', unread: false },
  { id: 6, category: '消息', title: '撤单申请已受理', content: '招商银行（600036）撤单申请已提交，当前状态：待撤。', time: '09-08 13:46', unread: false },
])
const messageCategories = ['全部', '通知', '消息', '待办']
const settingMenu = [
  { key: 'account', label: '账号信息' }, { key: 'language', label: '语言设置' },
  { key: 'trading', label: '交易与行情设置' }, { key: 'appearance', label: '系统外观' },
]
const filteredMessages = computed(() => messageCategory.value === '全部' ? messages.value : messages.value.filter(item => item.category === messageCategory.value))
const unreadMessageCount = computed(() => messages.value.filter(item => item.unread).length)
const pricePreviewClass = computed(() => colorRule.value === 'green-up' ? 'reverse' : '')
function categoryUnreadCount(category) { return messages.value.filter(item => item.unread && (category === '全部' || item.category === category)).length }
function messageIcon(category) { return assetUrl({ '全部': 'message-all.svg', '通知': 'message-notice.svg', '消息': 'message-system.svg', '待办': 'message-todo.svg' }[category]) }
function needsExpansion(message) { return message.content.length > 100 }
function messageIsExpanded(message) { return expandedMessageIds.value.includes(message.id) }
// 直接复用 Axure 导出的原始 SVG 图层；一个菜单图标由一个或两个图层组成。
const mainNav = [
  { label: '权益交易', icon: [['u76.svg', 0, 0, 14, 9], ['u77.svg', 0, 4, 14, 10]] },
  { label: '期权交易', icon: [['u83.svg', 0, 0, 13, 14], ['u84.svg', 7, 8, 6, 6]] },
  { label: '融资申请', icon: [['u90.svg', 2, 0, 10, 8], ['u91.svg', 0, 9, 14, 5]] },
  { label: '策略交易', icon: [['u100.svg', 0, 0, 12, 12], ['u101.svg', 3, 11, 7, 5]] },
  { label: '模拟交易', icon: [['u107.svg', 0, 0, 6, 7], ['u108.svg', 5, 0, 11, 15]] },
  { label: '数据', icon: [['u114.svg', 0, 0, 12, 13], ['u115.svg', 7, 6, 8, 8]] },
]
const overflowNav = computed(() => viewportWidth.value <= 980 ? mainNav.slice(3) : viewportWidth.value <= 1200 ? mainNav.slice(4) : [])
const visibleNav = computed(() => mainNav.slice(0, mainNav.length - overflowNav.value.length))
const workspace = ref(null), accountId = ref('TZS_T0'), showAll = ref(false), query = ref(''), market = ref('ALL'), positionType = ref('ALL')
const assetsVisible = ref(true), assetsCollapsed = ref(false)
const tab = ref('positions'), selectedCode = ref('000001'), table = ref(null), quote = ref(null)
const orderStatusMachine = ['未报', '待报', '已报', '待撤', '待撤［部成］', '部撤', '撤单', '部成', '全成', '被拒绝', '已报待改', '待改［部成］', '改单待审核', '撤单待审核', '新单待审核']
const orderStatusOptions = [{ label: '状态', value: 'ALL' }, ...orderStatusMachine.map(status => ({ label: status, value: status }))]
const demoOrders = ref(orderStatusMachine.map((status, index) => {
  const instrument = variantRows[index % variantRows.length]
  const quantity = (index + 1) * 100
  const partial = status.includes('部成') || status === '部撤'
  const filledQuantity = status === '全成' ? quantity : partial ? Math.floor(quantity / 2 / 100) * 100 : 0
  const price = index % 3 === 1 ? null : instrument.price
  return {
    id: `seed-${index + 1}`, orderNo: `WT20260911${String(index + 1).padStart(3, '0')}`,
    account: 'TZS_T0', code: instrument.code, name: instrument.name, type: price === null ? 'market' : 'limit',
    side: index % 2 ? 'sell' : 'buy', openClose: index % 3 ? '平' : '开', status,
    runStatus: ['部撤', '撤单', '全成', '被拒绝'].includes(status) ? '已结束' : '运行中',
    attribute: `${price === null ? '市价' : '限价'}·数量`, quantity, price,
    orderValueNumber: quantity, orderValue: `${number(quantity)} 股`, filledQuantity,
    filledPrice: filledQuantity ? instrument.price : null, estimate: (price || instrument.price) * quantity,
  }
}))
const orderFilters = ref({ orderNo: '', symbol: '', side: 'ALL', openClose: 'ALL', status: 'ALL' })
const sortState = ref({ prop: null, direction: null })
const orderSortState = ref({ prop: null, direction: null })
const positionColumnDefaults = [
  'direction', 'code', 'name', 'price', 'opening', 'available', 'valueWan', 'marginOccupied',
  'marginRate', 'totalProfit', 'dailyRealizedProfit', 'floatingProfit', 'account', 'market',
]
const visibleColumnKeys = ref([...positionColumnDefaults])
const columnOptions = [
  ['direction', '多空'], ['code', '标的代码'], ['name', '标的名称'], ['price', '持仓均价/最新价'],
  ['opening', '期初数量'], ['available', '可用数量'], ['valueWan', '市值(万)'], ['marginOccupied', '保证金占用'],
  ['marginRate', '保证金率(%)'], ['totalProfit', '总盈亏'], ['dailyRealizedProfit', '日内实现盈亏'],
  ['floatingProfit', '浮动盈亏'], ['account', '账户'], ['market', '市场'],
]
const orderColumnDefaults = ['runStatus', 'status', 'openClose', 'side', 'code', 'name', 'attribute', 'price', 'orderValueNumber', 'filledQuantity', 'filledPrice']
const orderVisibleColumnKeys = ref([...orderColumnDefaults])
const orderColumnOptions = [
  ['runStatus', '运行状态'], ['status', '委托状态'], ['openClose', '开平'], ['side', '买卖'], ['code', '标的代码'], ['name', '标的名称'], ['attribute', '委托类型'], ['price', '委托价格'], ['orderValueNumber', '委托数量/金额'], ['filledQuantity', '成交数量'], ['filledPrice', '成交均价'],
]
const { dock, collapsed, dragging, resizing, floating, start, startResize } = useTicketDock(workspace)
dock.value = variants.find(v => v.id === variant.value).dock
const account = computed(() => accounts.find(a => a.id === accountId.value))
const instruments = computed(() => variantRows.map(p => accountId.value === 'TZS_T0' ? p : { ...p, id: p.id.replace('T0','T1'), qty: p.qty*2, available: p.available*2, value: p.value*2, account:'TZS_T1' }))
const selected = computed(() => instruments.value.find(p => p.code === selectedCode.value) || marketInstruments.find(p => p.code === selectedCode.value))
const allRows = computed(() => showAll.value ? [...variantRows, ...variantRows.map(p => ({...p,id:p.id.replace('T0','T1'),qty:p.qty*2,available:p.available*2,value:p.value*2,account:'TZS_T1'}))] : instruments.value)
const filtered = computed(() => allRows.value.filter(p => (!query.value || `${p.code}${p.name}`.includes(query.value.trim())) && (market.value === 'ALL' || p.market === market.value) && (positionType.value === 'ALL' || p.direction === positionType.value)))
const sortedRows = computed(() => {
  const { prop, direction } = sortState.value
  if (!prop || !direction) return filtered.value
  const multiplier = direction === 'ascending' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    const left = a[prop], right = b[prop]
    if (typeof left === 'string') return left.localeCompare(right, 'zh-CN') * multiplier
    return (left - right) * multiplier
  })
})
const orders = computed(() => demoOrders.value.filter(o => (showAll.value || o.account === accountId.value) && (!orderFilters.value.orderNo || o.orderNo.includes(orderFilters.value.orderNo.trim())) && (!orderFilters.value.symbol || `${o.code}${o.name}`.includes(orderFilters.value.symbol.trim())) && (orderFilters.value.side === 'ALL' || o.side === orderFilters.value.side) && (orderFilters.value.openClose === 'ALL' || o.openClose === orderFilters.value.openClose) && (orderFilters.value.status === 'ALL' || o.status === orderFilters.value.status)))
const sortedOrders = computed(() => {
  const { prop, direction } = orderSortState.value
  if (!prop || !direction) return orders.value
  const multiplier = direction === 'ascending' ? 1 : -1
  return [...orders.value].sort((a, b) => ((Number(a[prop]) || 0) - (Number(b[prop]) || 0)) * multiplier)
})
const floatStyle = computed(() => dock.value === 'floating' ? { left: `${floating.value.x}px`, top: `${floating.value.y}px`, width:`${floating.value.width}px`, height:`${floating.value.height}px` } : {})
function chooseVariant(id) { variant.value = id; dock.value = variants.find(v => v.id === id).dock; collapsed.value = false; history.replaceState(null,'',`${location.pathname}?layout=${id}`) }
function openMessageCenter() { messageCenterVisible.value = true }
function markMessageRead(message) { message.unread = false }
function markAllMessagesRead() { messages.value.forEach(message => { message.unread = false }) }
function toggleMessageExpansion(message) {
  expandedMessageIds.value = messageIsExpanded(message)
    ? expandedMessageIds.value.filter(id => id !== message.id)
    : [...expandedMessageIds.value, message.id]
}
function dismissHeaderNotice() {
  showHeaderNotice.value = false
  localStorage.setItem(headerNoticeKey, '1')
}
function scrollToSetting(key) {
  activeSetting.value = key
  document.getElementById(`equity-${key}-setting`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function saveSettings() { settingsVisible.value = false }
function showEmergency(message) {
  if (message?.urgent) emergencyMessage.value = message
}
function toggleAssetsVisible() { assetsVisible.value = !assetsVisible.value; if (assetsCollapsed.value) assetsCollapsed.value = false }
function applyFilters() { table.value?.setScrollTop?.(0) }
function clearFilters() { query.value = ''; market.value = 'ALL'; positionType.value = 'ALL'; sortState.value = { prop: null, direction: null }; table.value?.clearFilter(); applyFilters() }
function exportPositions() {
  const header = ['多空', '标的代码', '标的名称', '持仓均价', '最新价', '可用数量', '市值(万)', '总盈亏', '账户', '市场']
  const records = sortedRows.value.map(row => [row.direction, `${row.code}.${row.market}`, row.name, money(row.cost), money(row.price), number(row.available), money(row.valueWan), money(row.totalProfit), row.account, row.market])
  const csv = [header, ...records].map(record => record.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = '持仓列表.csv'; link.click(); URL.revokeObjectURL(link.href)
}
function exportOrders() {
  const header = ['运行状态', '委托状态', '开平', '买卖', '标的代码', '标的名称', '委托类型', '委托价格', '委托数量/金额', '成交数量', '成交均价']
  const records = orders.value.map(row => [row.runStatus, row.status, row.openClose, row.side === 'buy' ? '买' : '卖', row.code, row.name, row.attribute, row.price === null ? '市价' : money(row.price), row.orderValue, row.filledQuantity ? number(row.filledQuantity) : '--', row.filledPrice === null ? '--' : money(row.filledPrice)])
  const csv = [header, ...records].map(record => record.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = '委托记录.csv'; link.click(); URL.revokeObjectURL(link.href)
}
function chooseDock(value) { dock.value = value; if(value === 'floating' && workspace.value) floating.value = {x:Math.max(0, workspace.value.clientWidth-350),y:12,width:340,height:Math.min(650,workspace.value.clientHeight-12)} }
function toggleSort(prop) { const current = sortState.value; sortState.value = current.prop !== prop || current.direction === null ? { prop, direction: 'ascending' } : current.direction === 'ascending' ? { prop, direction: 'descending' } : { prop: null, direction: null } }
function toggleOrderSort(prop) { const current = orderSortState.value; orderSortState.value = current.prop !== prop || current.direction === null ? { prop, direction: 'ascending' } : current.direction === 'ascending' ? { prop, direction: 'descending' } : { prop: null, direction: null } }
function orderStatusVisual(status) {
  if (status === '未报') return { tone: 'draft', icon: Document }
  if (['待报', '待撤', '待撤［部成］'].includes(status)) return { tone: 'pending', icon: Clock }
  if (status === '已报') return { tone: 'reported', icon: CircleCheck }
  if (['部撤', '部成', '待改［部成］'].includes(status)) return { tone: 'partial', icon: More }
  if (status === '全成') return { tone: 'success', icon: CircleCheck }
  if (status === '被拒绝') return { tone: 'rejected', icon: CircleClose }
  return { tone: 'review', icon: EditPen }
}
watch(accountId, () => { quote.value = null })
watch(collapsed, async () => { await nextTick(); table.value?.doLayout?.() })
const accountBalance = computed(() => account.value.id === 'TZS_T0' ? 1000000 : 700000)
function assetAmountParts(value) {
  const amount = Number(value) || 0
  const yi = Math.floor(amount / 100000000)
  const afterYi = amount - yi * 100000000
  const wan = Math.floor(afterYi / 10000)
  const rest = (afterYi - wan * 10000).toFixed(2)
  return [
    ...(yi ? [{ value: number(yi), unit: '亿' }] : []),
    ...(wan || yi ? [{ value: number(wan), unit: '万' }] : []),
    { value: rest, unit: '' },
  ]
}
function acceptOrder(order) { demoOrders.value.unshift(order); tab.value = 'orders' }
function orderAction(row, action) {
  if (action === '追单') { row.status = '已报'; row.runStatus = '运行中' }
  if (action === '改单') { row.status = '已报待改'; row.runStatus = '运行中' }
  if (action === '撤单') { row.status = '撤单'; row.runStatus = '已结束' }
}
function updateViewportWidth() { viewportWidth.value = window.innerWidth }
onMounted(() => {
  showHeaderNotice.value = localStorage.getItem(headerNoticeKey) !== '1'
  window.addEventListener('resize', updateViewportWidth)
  showEmergency(messages.value.find(item => item.urgent))
})
onBeforeUnmount(() => window.removeEventListener('resize', updateViewportWidth))
</script>

<template>
  <main class="variants-app" :class="`version-${variant}`">
    <header class="variant-header">
      <img :src="assetUrl('logo-faucon-trade.png')" alt="FAUCON TRADE"><i class="header-brand-divider" aria-hidden="true"></i>
      <nav aria-label="产品菜单">
        <button v-for="item in visibleNav" :key="item.label" :class="{ active: activeNav === item.label }" @click="activeNav = item.label"><span class="nav-menu-content"><span class="source-composite variant-nav-icon" aria-hidden="true"><img v-for="part in item.icon" :key="part[0]" :src="assetUrl(part[0])" :style="{ left: `${part[1]}px`, top: `${part[2]}px`, width: `${part[3]}px`, height: `${part[4]}px` }" alt=""></span><span class="nav-menu-label">{{ item.label }}</span></span></button>
        <el-dropdown v-if="overflowNav.length" trigger="click" popper-class="variant-nav-popper" @command="label => activeNav = label"><button class="more-nav" :class="{ active: overflowNav.some(item => item.label === activeNav) }">更多<el-icon><CaretBottom /></el-icon></button><template #dropdown><el-dropdown-menu><el-dropdown-item v-for="item in overflowNav" :key="item.label" :command="item.label"><span class="source-composite variant-nav-icon" aria-hidden="true"><img v-for="part in item.icon" :key="part[0]" :src="assetUrl(part[0])" :style="{ left: `${part[1]}px`, top: `${part[2]}px`, width: `${part[3]}px`, height: `${part[4]}px` }" alt=""></span>{{ item.label }}</el-dropdown-item></el-dropdown-menu></template></el-dropdown>
      </nav>
      <section v-if="showHeaderNotice && systemNoticeEnabled" class="header-marquee" aria-label="系统通知" role="button" tabindex="0" @click="openMessageCenter" @keydown.enter="openMessageCenter"><el-icon><InfoFilled /></el-icon><b>系统通知</b><span class="notice-scroll"><i>{{ headerNotice.text }}　{{ headerNotice.text }}</i></span><button type="button" aria-label="关闭系统通知" @click.stop="dismissHeaderNotice"><el-icon><Close /></el-icon></button></section>
      <div class="variant-header-end"><button class="notification-action" aria-label="打开消息中心" @click="openMessageCenter"><ClientLineIcon type="notification" /><em v-if="showUnreadBadge && unreadMessageCount">{{ unreadMessageCount }}</em></button><button class="header-settings-action" aria-label="系统设置" @click="settingsVisible=true"><el-icon><Setting /></el-icon></button><span class="small-avatar">K</span><span>Kevin Zhang</span></div>
    </header>
    <div ref="workspace" class="variants-workspace" :class="[`dock-${dock}`,{'ticket-collapsed':collapsed,'is-dragging':dragging}]">
      <section class="positions-pane workspace-panel">
        <header class="positions-tabs"><button :class="{active:tab==='positions'}" @click="tab='positions'">所有持仓<span>({{ allRows.length }})</span></button><button :class="{active:tab==='orders'}" @click="tab='orders'">所有委托<span>({{ orders.length }})</span></button><button :class="{active:tab==='trades'}" @click="tab='trades'">所有成交<span>(0)</span></button><el-switch v-model="showAll" active-text="展示全部账户" size="small" /><button v-if="collapsed" class="workspace-restore-ticket" @click="collapsed=false"><img class="restore-panel-icon" :src="assetUrl('panel-expand.svg')" alt=""><span class="restore-panel-label" style="color:#9ba3af!important;font-size:12px!important">展开下单面板</span></button></header>
        <template v-if="tab==='positions'">
          <div class="position-filters"><el-input v-model="query" :prefix-icon="Search" placeholder="代码 / 名称" aria-label="搜索持仓" clearable /><el-select v-model="market" aria-label="持仓市场" popper-class="variant-popper"><el-option label="全部市场" value="ALL"/><el-option label="深市" value="SZ"/><el-option label="沪市" value="SH"/></el-select><el-select v-model="positionType" aria-label="多空类型筛选" popper-class="variant-popper"><el-option label="全部多空类型" value="ALL"/><el-option label="多头" value="多"/><el-option label="空头" value="空"/></el-select><el-button class="filter-query" @click="applyFilters">查询</el-button><el-button link @click="clearFilters">重置</el-button><el-tooltip content="导出当前持仓" placement="top"><button class="export-positions" aria-label="导出持仓" @click="exportPositions"><el-icon><Download /></el-icon></button></el-tooltip></div>
          <TradingTable ref="table" class="original-fields" :data="sortedRows" height="100%" row-key="id" empty-text="无匹配持仓，请调整或重置筛选">
            <el-table-column type="index" width="30" fixed align="center" />
            <template v-for="columnKey in visibleColumnKeys" :key="columnKey">
              <el-table-column v-if="columnKey === 'direction'" prop="direction" label="多空" width="48" align="center" header-align="center" class-name="direction-column" label-class-name="direction-column"><template #default="{row}"><span class="direction-chip" :class="row.direction === '多' ? 'long' : 'short'">{{ row.direction }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'code'" prop="code" width="96"><template #header><SortHeader label="标的代码" :direction="sortState.prop === 'code' ? sortState.direction : null" @sort="toggleSort('code')" /></template><template #default="{row}">{{ row.code }}.{{ row.market }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'name'" prop="name" width="92"><template #header><SortHeader label="标的名称" :direction="sortState.prop === 'name' ? sortState.direction : null" @sort="toggleSort('name')" /></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'price'" prop="price" width="126" align="right" header-align="right"><template #header><SortHeader label="持仓均价/最新价" numeric :direction="sortState.prop === 'price' ? sortState.direction : null" @sort="toggleSort('price')" /></template><template #default="{row}"><span class="dim">{{ money(row.cost) }}</span> / <span :class="row.change>=0?'up':'down'">{{ money(row.price) }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'opening'" prop="opening" width="82" align="right" header-align="right"><template #header><SortHeader label="期初数量" numeric :direction="sortState.prop === 'opening' ? sortState.direction : null" @sort="toggleSort('opening')" /></template><template #default="{row}">{{ number(row.opening) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'available'" prop="available" width="82" align="right" header-align="right"><template #header><SortHeader label="可用数量" numeric :direction="sortState.prop === 'available' ? sortState.direction : null" @sort="toggleSort('available')" /></template><template #default="{row}">{{ number(row.available) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'valueWan'" prop="valueWan" width="82" align="right" header-align="right"><template #header><SortHeader label="市值(万)" numeric :direction="sortState.prop === 'valueWan' ? sortState.direction : null" @sort="toggleSort('valueWan')" /></template><template #default="{row}">{{ money(row.valueWan) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'marginOccupied'" prop="marginOccupied" width="92" align="right" header-align="right"><template #header><SortHeader label="保证金占用" numeric :direction="sortState.prop === 'marginOccupied' ? sortState.direction : null" @sort="toggleSort('marginOccupied')" /></template><template #default="{row}">{{ money(row.marginOccupied) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'marginRate'" prop="marginRate" width="94" align="right" header-align="right"><template #header><SortHeader label="保证金率(%)" numeric :direction="sortState.prop === 'marginRate' ? sortState.direction : null" @sort="toggleSort('marginRate')" /></template><template #default="{row}">{{ row.marginRate.toFixed(2) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'totalProfit'" prop="totalProfit" width="104" align="right" header-align="right"><template #header><span class="profit-heading"><SortHeader label="总盈亏" numeric :direction="sortState.prop === 'totalProfit' ? sortState.direction : null" @sort="toggleSort('totalProfit')" /><el-tooltip content="总盈亏 = 日内实现盈亏 + 浮动盈亏" placement="top" popper-class="order-help-popper"><button type="button" class="total-help" aria-label="总盈亏说明"><el-icon><InfoFilled /></el-icon></button></el-tooltip></span></template><template #default="{row}"><span :class="row.totalProfit >= 0 ? 'up' : 'down'">{{ money(row.totalProfit) }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'dailyRealizedProfit'" prop="dailyRealizedProfit" width="104" align="right" header-align="right"><template #header><SortHeader label="日内实现盈亏" numeric :direction="sortState.prop === 'dailyRealizedProfit' ? sortState.direction : null" @sort="toggleSort('dailyRealizedProfit')" /></template><template #default="{row}"><span :class="row.dailyRealizedProfit >= 0 ? 'up' : 'down'">{{ money(row.dailyRealizedProfit) }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'floatingProfit'" prop="floatingProfit" width="92" align="right" header-align="right"><template #header><SortHeader label="浮动盈亏" numeric :direction="sortState.prop === 'floatingProfit' ? sortState.direction : null" @sort="toggleSort('floatingProfit')" /></template><template #default="{row}"><span :class="row.floatingProfit >= 0 ? 'up' : 'down'">{{ money(row.floatingProfit) }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'account'" prop="account" label="账户" width="76" />
              <el-table-column v-else-if="columnKey === 'market'" prop="market" label="市场" width="58"><template #default="{row}">{{ row.market === 'SZ' ? '深市' : '沪市' }}</template></el-table-column>
            </template>
            <el-table-column label="操作" width="72" fixed="right" align="center" header-align="center" class-name="operation-column" label-class-name="operation-column"><template #default><div class="row-actions"><button type="button">追</button><button type="button">平</button></div></template></el-table-column>
            <el-table-column width="22" fixed="right" align="center" header-align="center" class-name="column-config-column" label-class-name="column-config-column"><template #header><ColumnConfigPopover v-model="visibleColumnKeys" :options="columnOptions" :defaults="positionColumnDefaults" /></template></el-table-column>
          </TradingTable><footer class="positions-footer"><span>显示 {{ filtered.length }} / {{ allRows.length }} 条</span></footer>
        </template>
        <template v-else-if="tab==='orders'">
          <div class="order-filters">
            <el-input v-model="orderFilters.symbol" :prefix-icon="Search" placeholder="标的名称 / 代码" aria-label="搜索委托标的" clearable />
            <el-select v-model="orderFilters.side" aria-label="买卖方向筛选" popper-class="variant-popper"><el-option label="买卖方向" value="ALL"/><el-option label="买入" value="buy"/><el-option label="卖出" value="sell"/></el-select>
            <el-select v-model="orderFilters.openClose" aria-label="开平类型筛选" popper-class="variant-popper"><el-option label="开平类型" value="ALL"/><el-option label="开" value="开"/><el-option label="平" value="平"/></el-select>
            <el-select v-model="orderFilters.status" aria-label="委托状态筛选" popper-class="variant-popper"><el-option v-for="option in orderStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select>
            <el-tooltip content="导出当前筛选结果" placement="top"><button class="export-orders" aria-label="导出委托记录" @click="exportOrders"><el-icon><Download /></el-icon></button></el-tooltip>
          </div>
          <TradingTable class="original-fields orders-table" :data="sortedOrders" height="100%" empty-text="暂无委托记录">
            <template v-for="columnKey in orderVisibleColumnKeys" :key="columnKey">
              <el-table-column v-if="columnKey === 'runStatus'" prop="runStatus" label="运行状态" width="92" class-name="run-status-column" label-class-name="run-status-column"><template #default="{row}"><span class="run-status" :class="row.runStatus === '运行中' ? 'is-running' : 'is-ended'"><el-icon><CircleCheck v-if="row.runStatus === '运行中'" /><CircleClose v-else /></el-icon>{{ row.runStatus }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'status'" prop="status" label="委托状态" width="112"><template #default="{row}"><span class="order-status" :class="`is-${orderStatusVisual(row.status).tone}`"><el-icon><component :is="orderStatusVisual(row.status).icon" /></el-icon>{{ row.status }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'openClose'" prop="openClose" label="开平" width="54" align="left" header-align="left"/>
              <el-table-column v-else-if="columnKey === 'side'" label="买卖" width="54" align="left" header-align="left"><template #default="{row}"><span :class="row.side==='buy'?'up':'down'">{{ row.side==='buy'?'买':'卖' }}</span></template></el-table-column>
              <el-table-column v-else-if="columnKey === 'code'" prop="code" label="标的代码" width="92"/>
              <el-table-column v-else-if="columnKey === 'name'" prop="name" label="标的名称" width="110"/>
              <el-table-column v-else-if="columnKey === 'attribute'" prop="attribute" label="委托类型" width="100"/>
              <el-table-column v-else-if="columnKey === 'price'" prop="price" width="98" align="right" header-align="right"><template #header><SortHeader label="委托价格" numeric :direction="orderSortState.prop === 'price' ? orderSortState.direction : null" @sort="toggleOrderSort('price')" /></template><template #default="{row}">{{ row.price === null ? '市价' : money(row.price) }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'orderValueNumber'" prop="orderValueNumber" width="160" align="right" header-align="right"><template #header><SortHeader label="委托数量/金额" numeric :direction="orderSortState.prop === 'orderValueNumber' ? orderSortState.direction : null" @sort="toggleOrderSort('orderValueNumber')" /></template><template #default="{row}">{{ row.orderValue }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'filledQuantity'" prop="filledQuantity" width="92" align="right" header-align="right"><template #header><SortHeader label="成交数量" numeric :direction="orderSortState.prop === 'filledQuantity' ? orderSortState.direction : null" @sort="toggleOrderSort('filledQuantity')" /></template><template #default="{row}">{{ row.filledQuantity ? number(row.filledQuantity) : '--' }}</template></el-table-column>
              <el-table-column v-else-if="columnKey === 'filledPrice'" prop="filledPrice" width="92" align="right" header-align="right"><template #header><SortHeader label="成交均价" numeric :direction="orderSortState.prop === 'filledPrice' ? orderSortState.direction : null" @sort="toggleOrderSort('filledPrice')" /></template><template #default="{row}">{{ row.filledPrice === null ? '--' : money(row.filledPrice) }}</template></el-table-column>
            </template>
            <el-table-column label="操作" width="78" fixed="right" align="center" class-name="operation-column" label-class-name="operation-column"><template #default="{row}"><div class="order-row-actions"><button type="button" title="追单" aria-label="追单" @click="orderAction(row, '追单')">追</button><button type="button" title="改单" aria-label="改单" @click="orderAction(row, '改单')">改</button><button type="button" title="撤单" aria-label="撤单" @click="orderAction(row, '撤单')">撤</button></div></template></el-table-column>
            <el-table-column width="22" fixed="right" align="center" header-align="center" class-name="column-config-column" label-class-name="column-config-column"><template #header><ColumnConfigPopover v-model="orderVisibleColumnKeys" :options="orderColumnOptions" :defaults="orderColumnDefaults" /></template></el-table-column>
          </TradingTable>
        </template>
        <div v-else class="no-trades"><el-icon><Document /></el-icon><h3>暂无成交</h3><p>演示委托不会生成实际成交</p></div>
      </section>
      <section class="trade-dock" :class="{floating:dock==='floating', resizing, 'assets-collapsed':assetsCollapsed}" :style="floatStyle">
        <OrderBook v-show="!collapsed" :symbol="selected" :compact="dock === 'bottom'" @drag="start" @quote="value=>{quote=value;collapsed=false}" />
        <section v-show="!collapsed" class="ticket-pane workspace-panel">
          <header class="module-heading drag-heading" @pointerdown="start"><span class="drag-title"><span class="drag-grip" aria-hidden="true"><i v-for="n in 8" :key="n" /></span><h2>交易委托</h2></span><button aria-label="收起交易区域" class="collapse-ticket" @pointerdown.stop @click="collapsed=true"><img :src="assetUrl('panel-collapse.svg')" alt=""></button></header>
          <OrderTicket :instruments="marketInstruments" :accounts="accounts" :symbol="selected" :account="account" :quote="quote" @account-select="id=>accountId=id" @select="code=>selectedCode=code" @order="acceptOrder" />
        </section>
        <section v-show="!collapsed" class="compact-assets ticket-assets" :class="{ 'is-collapsed': assetsCollapsed }" aria-label="账户资金"><div class="asset-summary-heading"><span>资产账户概要</span><button class="asset-visibility" type="button" :aria-label="assetsVisible ? '隐藏资金数值' : '查看资金数值'" @click="toggleAssetsVisible"><el-icon><View v-if="assetsVisible" /><Hide v-else /></el-icon></button><button class="asset-collapse" type="button" :aria-label="assetsCollapsed ? '展开资产账户概要' : '收起资产账户概要'" @click="assetsCollapsed=!assetsCollapsed"><el-icon><ArrowDownBold /></el-icon></button></div><div v-show="!assetsCollapsed" class="asset-summary-grid"><div class="asset-metric asset-available"><span>大账户可用</span><el-tooltip v-if="assetsVisible" placement="top" popper-class="asset-value-popper"><template #content><span class="asset-large-value"><template v-for="part in assetAmountParts(account.cash)" :key="`${part.value}${part.unit}`"><b>{{ part.value }}</b><i v-if="part.unit">{{ part.unit }}</i></template></span></template><b class="asset-number">{{ money(account.cash) }}</b></el-tooltip><b v-else class="asset-number">••••••••</b><small>CNY</small></div><div class="asset-metric"><span>大账户余额</span><el-tooltip v-if="assetsVisible" placement="top" popper-class="asset-value-popper"><template #content><span class="asset-large-value"><template v-for="part in assetAmountParts(accountBalance)" :key="`${part.value}${part.unit}`"><b>{{ part.value }}</b><i v-if="part.unit">{{ part.unit }}</i></template></span></template><b class="asset-number">{{ money(accountBalance) }}</b></el-tooltip><b v-else class="asset-number">••••••••</b><small>CNY</small></div></div></section>
        <button v-if="dock === 'floating'" type="button" class="floating-resize-handle" aria-label="调整下单面板高度" @pointerdown="startResize"><span></span></button>
      </section>
      <div v-if="dragging" class="dock-targets"><div class="dock-target target-left">停靠左侧</div><div class="dock-target target-right">停靠右侧</div><div class="dock-target target-bottom">停靠底部</div><span class="float-instruction">拖至边缘停靠 · 放在中间悬浮</span></div>
    </div>
    <footer class="variant-status"><span><i class="status-dot"/>运行中 · 演示环境</span><span>行情：静态快照</span><span class="status-end">系统版本：方案 V0.2</span></footer>
    <el-dialog v-model="messageCenterVisible" width="760px" align-center class="message-center-dialog" :show-close="false">
      <template #header><header class="message-center-header"><h2>消息中心</h2><div class="message-header-actions"><button type="button" class="message-close-action" aria-label="关闭消息中心" @click="messageCenterVisible=false"><el-icon><Close /></el-icon></button></div></header></template>
      <div class="message-center-layout"><nav class="message-category-tabs" aria-label="消息分类"><button v-for="category in messageCategories" :key="category" :class="{ active: messageCategory === category }" @click="messageCategory=category"><img class="message-category-icon" :src="messageIcon(category)" alt=""><span>{{ category }}</span><i v-if="categoryUnreadCount(category)">{{ categoryUnreadCount(category) }}</i></button></nav>
        <section class="message-list" aria-label="消息列表"><header><div class="message-list-heading"><b>{{ messageCategory }}</b><span v-if="categoryUnreadCount(messageCategory)" class="message-list-actions"><strong>{{ categoryUnreadCount(messageCategory) }}</strong> 条未读</span></div><button v-if="unreadMessageCount" type="button" class="mark-all-read" @click="markAllMessagesRead">全部标为已读</button></header><article v-for="message in filteredMessages" :key="message.id" class="message-item" :class="[`is-${message.category}`, { unread: message.unread, expanded: messageIsExpanded(message) }]" @click="markMessageRead(message)"><span class="message-type-icon"><img :src="messageIcon(message.category)" alt=""></span><div class="message-copy"><span class="message-title-row"><b>{{ message.title }}</b><em>{{ message.category }}</em></span><p>{{ message.content }}</p><button v-if="needsExpansion(message)" type="button" @click.stop="toggleMessageExpansion(message)">{{ messageIsExpanded(message) ? '收起' : '展开全部' }}</button></div><time>{{ message.time }}</time><i v-if="message.unread" aria-label="未读"></i></article><p v-if="!filteredMessages.length" class="message-empty">当前分类暂无消息</p></section>
      </div>
    </el-dialog>
    <el-dialog v-model="emergencyMessage" width="420px" align-center class="emergency-message-dialog" title="紧急通知"><section v-if="emergencyMessage"><h3>{{ emergencyMessage.title }}</h3><p>{{ emergencyMessage.content }}</p></section><template #footer><el-button type="primary" @click="emergencyMessage=null">我知道了</el-button></template></el-dialog>
    <el-dialog v-model="settingsVisible" class="settings-dialog equity-settings-dialog" width="700px" :show-close="false" :close-on-click-modal="true" destroy-on-close>
      <template #header><div class="settings-title"><h2>系统设置</h2><button @click="settingsVisible=false"><el-icon><Close /></el-icon></button></div></template>
      <div class="settings-layout"><nav class="settings-nav"><button v-for="item in settingMenu" :key="item.key" :class="{ active: activeSetting === item.key }" @click="scrollToSetting(item.key)"><SettingsMenuIcon :name="item.key" />{{ item.label }}</button></nav><el-scrollbar class="settings-content"><section id="equity-account-setting" class="settings-section"><h3>账号信息</h3><div class="setting-row"><span>登录密码</span><el-button plain>修改密码</el-button></div><div class="setting-row"><span>开机启动</span><el-switch v-model="autoLaunch" /></div></section><section id="equity-language-setting" class="settings-section"><h3>语言设置</h3><div class="setting-row"><span>显示语言</span><el-radio-group v-model="language" class="settings-radio-group"><el-radio class="settings-radio" label="简体中文">简体中文</el-radio><el-radio class="settings-radio" label="繁體中文">繁體中文</el-radio><el-radio class="settings-radio" label="English">English</el-radio></el-radio-group></div></section><section id="equity-trading-setting" class="settings-section"><h3>交易与行情设置</h3><div class="setting-row"><span>委托价设置</span><el-radio-group v-model="orderPrice" class="settings-radio-group"><el-radio class="settings-radio" label="买一">买一</el-radio><el-radio class="settings-radio" label="卖一">卖一</el-radio><el-radio class="settings-radio" label="最新价">最新价</el-radio></el-radio-group></div><div class="setting-row"><span>涨跌幅颜色</span><el-radio-group v-model="colorRule" class="settings-radio-group"><el-radio class="settings-radio" label="red-up">红涨绿跌</el-radio><el-radio class="settings-radio" label="green-up">绿涨红跌</el-radio></el-radio-group></div><div class="price-preview" :class="pricePreviewClass"><span class="up">↑ 2.48%</span><span class="down">↓ 1.36%</span></div></section><section id="equity-appearance-setting" class="settings-section"><h3>系统外观</h3><div class="setting-row"><span>主题模式</span><el-radio-group v-model="theme" class="settings-radio-group"><el-radio class="settings-radio" label="dark">深色模式</el-radio><el-radio class="settings-radio" label="light">浅色模式</el-radio></el-radio-group></div><div class="theme-cards"><button :class="{ selected: theme === 'dark' }" @click="theme='dark'"><span class="mini-screen dark"><i /><b /><em /><em /><em /></span>深色模式</button><button :class="{ selected: theme === 'light' }" @click="theme='light'"><span class="mini-screen light"><i /><b /><em /><em /><em /></span>浅色模式</button></div></section></el-scrollbar></div>
      <template #footer><div class="settings-footer"><el-button @click="settingsVisible=false">取 消</el-button><el-button type="primary" @click="saveSettings">保存设置</el-button></div></template>
    </el-dialog>
  </main>
</template>
