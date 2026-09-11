<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDownBold, CaretBottom, Search, Fold, Expand, Document, Setting, InfoFilled, Download, View, Hide } from '@element-plus/icons-vue'
import ClientLineIcon from '../../ClientLineIcon.vue'
import { accounts } from './fixtures'
import { marketInstruments, variantRows, variants, money, number } from './variantData'
import { useTicketDock } from './useTicketDock'
import OrderTicket from './components/OrderTicket.vue'
import OrderBook from './components/OrderBook.vue'
import SortHeader from './components/SortHeader.vue'

const initialVariant = new URLSearchParams(location.search).get('layout')
const assetUrl = name => `${import.meta.env.BASE_URL}original-icons/${name}`
const variant = ref(variants.some(v => v.id === initialVariant) ? initialVariant : 'classic')
const activeNav = ref('权益交易')
const viewportWidth = ref(window.innerWidth)
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
const demoOrders = ref([])
const orderFilters = ref({ orderNo: '', symbol: '', side: 'ALL', openClose: 'ALL', status: 'ALL' })
const sortState = ref({ prop: null, direction: null })
const visibleColumnKeys = ref([
  'direction', 'code', 'name', 'price', 'opening', 'available', 'valueWan', 'marginOccupied',
  'marginRate', 'totalProfit', 'dailyRealizedProfit', 'floatingProfit', 'account', 'market',
])
const columnOptions = [
  ['direction', '多空'], ['code', '标的代码'], ['name', '标的名称'], ['price', '持仓均价/最新价'],
  ['opening', '期初数量'], ['available', '可用数量'], ['valueWan', '市值(万)'], ['marginOccupied', '保证金占用'],
  ['marginRate', '保证金率(%)'], ['totalProfit', '总盈亏'], ['dailyRealizedProfit', '日内实现盈亏'],
  ['floatingProfit', '浮动盈亏'], ['account', '账户'], ['market', '市场'],
]
const { dock, collapsed, dragging, floating, start } = useTicketDock(workspace)
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
const floatStyle = computed(() => dock.value === 'floating' ? { left: `${floating.value.x}px`, top: `${floating.value.y}px`, width:`${floating.value.width}px`, height:`${floating.value.height}px` } : {})
function chooseVariant(id) { variant.value = id; dock.value = variants.find(v => v.id === id).dock; collapsed.value = false; history.replaceState(null,'',`${location.pathname}?layout=${id}`) }
function toggleAssetsVisible() { assetsVisible.value = !assetsVisible.value; if (assetsCollapsed.value) assetsCollapsed.value = false }
function selectRow(row) { accountId.value = row.account; selectedCode.value = row.code }
function applyFilters() { table.value?.setScrollTop?.(0) }
function clearFilters() { query.value = ''; market.value = 'ALL'; positionType.value = 'ALL'; sortState.value = { prop: null, direction: null }; table.value?.clearFilter(); applyFilters() }
function exportPositions() {
  const header = ['多空', '标的代码', '标的名称', '持仓均价', '最新价', '可用数量', '市值(万)', '总盈亏', '账户', '市场']
  const records = sortedRows.value.map(row => [row.direction, `${row.code}.${row.market}`, row.name, money(row.cost), money(row.price), number(row.available), money(row.valueWan), money(row.totalProfit), row.account, row.market])
  const csv = [header, ...records].map(record => record.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = '持仓列表.csv'; link.click(); URL.revokeObjectURL(link.href)
}
function exportOrders() {
  const header = ['运行状态', '委托状态', '开平', '买卖', '标的代码', '标的名称', '委托属性', '委托价格', '委托数量/金额']
  const records = orders.value.map(row => [row.runStatus, row.status, row.openClose, row.side === 'buy' ? '买' : '卖', row.code, row.name, row.attribute, row.price === null ? '市价' : money(row.price), row.orderValue])
  const csv = [header, ...records].map(record => record.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = '委托记录.csv'; link.click(); URL.revokeObjectURL(link.href)
}
function chooseDock(value) { dock.value = value; if(value === 'floating' && workspace.value) floating.value = {x:Math.max(0, workspace.value.clientWidth-350),y:12,width:340,height:Math.min(650,workspace.value.clientHeight-12)} }
function toggleSort(prop) { const current = sortState.value; sortState.value = current.prop !== prop || current.direction === null ? { prop, direction: 'ascending' } : current.direction === 'ascending' ? { prop, direction: 'descending' } : { prop: null, direction: null } }
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
function updateViewportWidth() { viewportWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', updateViewportWidth))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewportWidth))
</script>

<template>
  <main class="variants-app" :class="`version-${variant}`">
    <header class="variant-header"><img :src="assetUrl('logo-faucon-trade.png')" alt="FAUCON TRADE"><i class="header-brand-divider" aria-hidden="true"></i><nav aria-label="产品菜单"><button v-for="item in visibleNav" :key="item.label" :class="{ active: activeNav === item.label }" @click="activeNav = item.label"><span class="nav-menu-content"><span class="source-composite variant-nav-icon" aria-hidden="true"><img v-for="part in item.icon" :key="part[0]" :src="assetUrl(part[0])" :style="{ left: `${part[1]}px`, top: `${part[2]}px`, width: `${part[3]}px`, height: `${part[4]}px` }" alt=""></span><span class="nav-menu-label">{{ item.label }}</span></span></button><el-dropdown v-if="overflowNav.length" trigger="click" popper-class="variant-nav-popper" @command="label => activeNav = label"><button class="more-nav" :class="{ active: overflowNav.some(item => item.label === activeNav) }">更多<el-icon><CaretBottom /></el-icon></button><template #dropdown><el-dropdown-menu><el-dropdown-item v-for="item in overflowNav" :key="item.label" :command="item.label"><span class="source-composite variant-nav-icon" aria-hidden="true"><img v-for="part in item.icon" :key="part[0]" :src="assetUrl(part[0])" :style="{ left: `${part[1]}px`, top: `${part[2]}px`, width: `${part[3]}px`, height: `${part[4]}px` }" alt=""></span>{{ item.label }}</el-dropdown-item></el-dropdown-menu></template></el-dropdown></nav><div class="variant-header-end"><span class="demo-label">演示环境</span><button class="notification-action" aria-label="系统消息"><ClientLineIcon type="notification" /></button><span class="small-avatar">K</span><span>Kevin Zhang</span></div></header>
    <div ref="workspace" class="variants-workspace" :class="[`dock-${dock}`,{'ticket-collapsed':collapsed,'is-dragging':dragging}]">
      <section class="positions-pane workspace-panel">
        <header class="positions-tabs"><button :class="{active:tab==='positions'}" @click="tab='positions'">所有持仓<span>({{ allRows.length }})</span></button><button :class="{active:tab==='orders'}" @click="tab='orders'">所有委托<span>({{ orders.length }})</span></button><button :class="{active:tab==='trades'}" @click="tab='trades'">所有成交<span>(0)</span></button><el-switch v-model="showAll" active-text="展示全部账户" size="small" /><button v-if="collapsed" class="workspace-restore-ticket" @click="collapsed=false"><el-icon class="restore-panel-icon" style="color:#9ba3af!important;font-size:12px!important"><Expand /></el-icon><span class="restore-panel-label" style="color:#9ba3af!important;font-size:12px!important">展开下单面板</span></button></header>
        <template v-if="tab==='positions'">
          <div class="position-filters"><el-input v-model="query" :prefix-icon="Search" placeholder="代码 / 名称" aria-label="搜索持仓" clearable /><el-select v-model="market" aria-label="持仓市场" popper-class="variant-popper"><el-option label="全部市场" value="ALL"/><el-option label="深市" value="SZ"/><el-option label="沪市" value="SH"/></el-select><el-select v-model="positionType" aria-label="多空类型筛选" popper-class="variant-popper"><el-option label="全部多空类型" value="ALL"/><el-option label="多头" value="多"/><el-option label="空头" value="空"/></el-select><el-button class="filter-query" @click="applyFilters">查询</el-button><el-button link @click="clearFilters">重置</el-button><el-tooltip content="导出当前持仓" placement="top"><button class="export-positions" aria-label="导出持仓" @click="exportPositions"><el-icon><Download /></el-icon></button></el-tooltip></div>
          <el-table ref="table" class="original-fields" :data="sortedRows" height="100%" row-key="id" :row-class-name="({row})=>row.code===selectedCode && row.account===accountId?'chosen-position':''" @row-click="selectRow" empty-text="无匹配持仓，请调整或重置筛选">
            <el-table-column type="index" width="30" fixed align="center" />
            <el-table-column v-if="visibleColumnKeys.includes('direction')" prop="direction" label="多空" width="48" align="center" header-align="center" class-name="direction-column" label-class-name="direction-column"><template #default="{row}"><span class="direction-chip" :class="row.direction === '多' ? 'long' : 'short'">{{ row.direction }}</span></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('code')" prop="code" width="96"><template #header><SortHeader label="标的代码" :direction="sortState.prop === 'code' ? sortState.direction : null" @sort="toggleSort('code')" /></template><template #default="{row}">{{ row.code }}.{{ row.market }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('name')" prop="name" width="92"><template #header><SortHeader label="标的名称" :direction="sortState.prop === 'name' ? sortState.direction : null" @sort="toggleSort('name')" /></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('price')" prop="price" width="126" align="right" header-align="right"><template #header><SortHeader label="持仓均价/最新价" numeric :direction="sortState.prop === 'price' ? sortState.direction : null" @sort="toggleSort('price')" /></template><template #default="{row}"><span class="dim">{{ money(row.cost) }}</span> / <span :class="row.change>=0?'up':'down'">{{ money(row.price) }}</span></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('opening')" prop="opening" width="82" align="right" header-align="right"><template #header><SortHeader label="期初数量" numeric :direction="sortState.prop === 'opening' ? sortState.direction : null" @sort="toggleSort('opening')" /></template><template #default="{row}">{{ number(row.opening) }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('available')" prop="available" width="82" align="right" header-align="right"><template #header><SortHeader label="可用数量" numeric :direction="sortState.prop === 'available' ? sortState.direction : null" @sort="toggleSort('available')" /></template><template #default="{row}">{{ number(row.available) }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('valueWan')" prop="valueWan" width="82" align="right" header-align="right"><template #header><SortHeader label="市值(万)" numeric :direction="sortState.prop === 'valueWan' ? sortState.direction : null" @sort="toggleSort('valueWan')" /></template><template #default="{row}">{{ money(row.valueWan) }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('marginOccupied')" prop="marginOccupied" width="92" align="right" header-align="right"><template #header><SortHeader label="保证金占用" numeric :direction="sortState.prop === 'marginOccupied' ? sortState.direction : null" @sort="toggleSort('marginOccupied')" /></template><template #default="{row}">{{ money(row.marginOccupied) }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('marginRate')" prop="marginRate" width="94" align="right" header-align="right"><template #header><SortHeader label="保证金率(%)" numeric :direction="sortState.prop === 'marginRate' ? sortState.direction : null" @sort="toggleSort('marginRate')" /></template><template #default="{row}">{{ row.marginRate.toFixed(2) }}</template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('totalProfit')" prop="totalProfit" width="104" align="right" header-align="right"><template #header><span class="profit-heading"><SortHeader label="总盈亏" numeric :direction="sortState.prop === 'totalProfit' ? sortState.direction : null" @sort="toggleSort('totalProfit')" /><el-tooltip content="总盈亏 = 日内实现盈亏 + 浮动盈亏" placement="top" popper-class="order-help-popper"><button type="button" class="total-help" aria-label="总盈亏说明"><el-icon><InfoFilled /></el-icon></button></el-tooltip></span></template><template #default="{row}"><span :class="row.totalProfit >= 0 ? 'up' : 'down'">{{ money(row.totalProfit) }}</span></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('dailyRealizedProfit')" prop="dailyRealizedProfit" width="104" align="right" header-align="right"><template #header><SortHeader label="日内实现盈亏" numeric :direction="sortState.prop === 'dailyRealizedProfit' ? sortState.direction : null" @sort="toggleSort('dailyRealizedProfit')" /></template><template #default="{row}"><span :class="row.dailyRealizedProfit >= 0 ? 'up' : 'down'">{{ money(row.dailyRealizedProfit) }}</span></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('floatingProfit')" prop="floatingProfit" width="92" align="right" header-align="right"><template #header><SortHeader label="浮动盈亏" numeric :direction="sortState.prop === 'floatingProfit' ? sortState.direction : null" @sort="toggleSort('floatingProfit')" /></template><template #default="{row}"><span :class="row.floatingProfit >= 0 ? 'up' : 'down'">{{ money(row.floatingProfit) }}</span></template></el-table-column>
            <el-table-column v-if="visibleColumnKeys.includes('account')" prop="account" label="账户" width="76" />
            <el-table-column v-if="visibleColumnKeys.includes('market')" prop="market" label="市场" width="58"><template #default="{row}">{{ row.market === 'SZ' ? '深市' : '沪市' }}</template></el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" header-align="center" class-name="operation-column" label-class-name="operation-column"><template #default><div class="row-actions"><button type="button">追</button><button type="button">平</button></div></template></el-table-column>
            <el-table-column width="22" fixed="right" align="center" header-align="center" class-name="column-config-column" label-class-name="column-config-column"><template #header><el-popover placement="bottom-end" :width="220" trigger="click" popper-class="column-config-popper"><template #reference><button class="column-config-trigger" aria-label="自定义列"><el-icon><Setting /></el-icon></button></template><div class="column-config"><div><b>自定义列</b><span>选择显示字段</span></div><el-checkbox-group v-model="visibleColumnKeys"><el-checkbox v-for="option in columnOptions" :key="option[0]" :label="option[0]">{{ option[1] }}</el-checkbox></el-checkbox-group></div></el-popover></template></el-table-column>
          </el-table><footer class="positions-footer"><span>显示 {{ filtered.length }} / {{ allRows.length }} 条</span></footer>
        </template>
        <template v-else-if="tab==='orders'"><div class="order-filters"><el-input v-model="orderFilters.orderNo" :prefix-icon="Search" placeholder="委托编号" aria-label="按委托编号筛选" clearable /><el-input v-model="orderFilters.symbol" placeholder="标的物" aria-label="按标的物筛选" clearable /><el-select v-model="orderFilters.side" aria-label="买卖方向筛选" popper-class="variant-popper"><el-option label="买卖方向" value="ALL"/><el-option label="买入" value="buy"/><el-option label="卖出" value="sell"/></el-select><el-select v-model="orderFilters.openClose" aria-label="开平类型筛选" popper-class="variant-popper"><el-option label="开平类型" value="ALL"/><el-option label="开" value="开"/><el-option label="平" value="平"/></el-select><el-select v-model="orderFilters.status" aria-label="委托状态筛选" popper-class="variant-popper"><el-option label="状态" value="ALL"/><el-option label="待报" value="待报"/><el-option label="已撤销" value="已撤销"/></el-select><span>原型委托记录 · 未接入交易系统</span><el-tooltip content="导出当前筛选结果" placement="top"><button class="export-orders" aria-label="导出委托记录" @click="exportOrders"><el-icon><Download /></el-icon></button></el-tooltip></div><el-table class="orders-table" :data="orders" height="100%" empty-text="暂无委托记录"><el-table-column prop="runStatus" label="运行状态" width="76"/><el-table-column prop="status" label="委托状态" width="76"/><el-table-column prop="openClose" label="开平" width="54" align="center"/><el-table-column label="买卖" width="54" align="center"><template #default="{row}"><span :class="row.side==='buy'?'up':'down'">{{ row.side==='buy'?'买':'卖' }}</span></template></el-table-column><el-table-column prop="code" label="标的代码" width="92"/><el-table-column prop="name" label="标的名称" width="110"/><el-table-column prop="attribute" label="委托属性" width="100"/><el-table-column label="委托价格" width="98" align="right" header-align="right"><template #default="{row}">{{ row.price === null ? '市价' : money(row.price) }}</template></el-table-column><el-table-column prop="orderValue" label="委托数量/金额" min-width="126" align="right" header-align="right"/><el-table-column label="操作" width="70" fixed="right" align="center"><template #default="{row}"><el-button link :disabled="row.status==='已撤销'" @click="row.status='已撤销'">撤销</el-button></template></el-table-column></el-table></template>
        <div v-else class="no-trades"><el-icon><Document /></el-icon><h3>暂无成交</h3><p>演示委托不会生成实际成交</p></div>
      </section>
      <section class="trade-dock" :class="{floating:dock==='floating','assets-collapsed':assetsCollapsed}" :style="floatStyle">
        <OrderBook v-show="!collapsed" :symbol="selected" :compact="dock === 'bottom'" @drag="start" @quote="value=>{quote=value;collapsed=false}" />
        <section v-show="!collapsed" class="ticket-pane workspace-panel">
          <header class="module-heading drag-heading" @pointerdown="start"><span class="drag-title"><span class="drag-grip" aria-hidden="true"><i v-for="n in 8" :key="n" /></span><h2>交易委托</h2></span><button aria-label="收起交易区域" class="collapse-ticket" @pointerdown.stop @click="collapsed=true"><el-icon><Fold /></el-icon></button></header>
          <OrderTicket :instruments="marketInstruments" :accounts="accounts" :symbol="selected" :account="account" :quote="quote" @account-select="id=>accountId=id" @select="code=>selectedCode=code" @order="acceptOrder" />
        </section>
        <section v-show="!collapsed" class="compact-assets ticket-assets" :class="{ 'is-collapsed': assetsCollapsed }" aria-label="账户资金"><div class="asset-summary-heading"><span>资产账户概要</span><button class="asset-visibility" type="button" :aria-label="assetsVisible ? '隐藏资金数值' : '查看资金数值'" @click="toggleAssetsVisible"><el-icon><View v-if="assetsVisible" /><Hide v-else /></el-icon></button><button class="asset-collapse" type="button" :aria-label="assetsCollapsed ? '展开资产账户概要' : '收起资产账户概要'" @click="assetsCollapsed=!assetsCollapsed"><el-icon><ArrowDownBold /></el-icon></button></div><div v-show="!assetsCollapsed" class="asset-summary-grid"><div class="asset-metric asset-available"><span>大账户可用</span><el-tooltip v-if="assetsVisible" placement="top" popper-class="asset-value-popper"><template #content><span class="asset-large-value"><template v-for="part in assetAmountParts(account.cash)" :key="`${part.value}${part.unit}`"><b>{{ part.value }}</b><i v-if="part.unit">{{ part.unit }}</i></template></span></template><b class="asset-number">{{ money(account.cash) }}</b></el-tooltip><b v-else class="asset-number">••••••••</b><small>CNY</small></div><div class="asset-metric"><span>大账户余额</span><el-tooltip v-if="assetsVisible" placement="top" popper-class="asset-value-popper"><template #content><span class="asset-large-value"><template v-for="part in assetAmountParts(accountBalance)" :key="`${part.value}${part.unit}`"><b>{{ part.value }}</b><i v-if="part.unit">{{ part.unit }}</i></template></span></template><b class="asset-number">{{ money(accountBalance) }}</b></el-tooltip><b v-else class="asset-number">••••••••</b><small>CNY</small></div></div></section>
      </section>
      <div v-if="dragging" class="dock-targets"><div class="dock-target target-left">停靠左侧</div><div class="dock-target target-right">停靠右侧</div><div class="dock-target target-bottom">停靠底部</div><span class="float-instruction">拖至边缘停靠 · 放在中间悬浮</span></div>
    </div>
    <footer class="variant-status"><span><i class="status-dot"/>运行中 · 演示环境</span><span>行情：静态快照</span><span class="status-end">系统版本：方案 V0.2</span></footer>
  </main>
</template>
