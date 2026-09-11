<script setup>
import { computed, ref, watch } from 'vue'
import { Bell, ArrowDown, Search, Refresh, Setting, Connection, TrendCharts, Document, DataAnalysis } from '@element-plus/icons-vue'
import { accounts, positions } from './fixtures'

const accountId = ref('TZS_T0'), query = ref(''), selectedCode = ref('000001'), tab = ref('持仓')
const side = ref('buy'), price = ref(11.78), quantity = ref(0), fraction = ref(0), confirmOpen = ref(false), confirmedOrder = ref(null)
const orders = ref([])
const account = computed(() => accounts.find(a => a.id === accountId.value))
const rows = computed(() => positions.map(p => accountId.value === 'TZS_T0' ? p : { ...p, qty: p.qty * 2, available: p.available * 2 }))
const selected = computed(() => rows.value.find(p => p.code === selectedCode.value))
const filtered = computed(() => rows.value.filter(p => `${p.code}${p.name}`.includes(query.value.trim())))
const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const number = n => Number(n).toLocaleString('en-US')
const signed = n => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`
const marketValue = computed(() => rows.value.reduce((s, p) => s + p.price * p.qty, 0))
const pnl = computed(() => rows.value.reduce((s, p) => s + (p.price - p.cost) * p.qty, 0))
const limit = computed(() => side.value === 'buy' ? (price.value > 0 ? Math.floor(account.value.cash / price.value / 100) * 100 : 0) : selected.value.available)
const validation = computed(() => {
  if (!price.value || price.value <= 0) return '请输入有效的限价。'
  if (!quantity.value) return '输入委托数量后，可预览订单。'
  if (quantity.value < 0 || quantity.value % 100 !== 0) return '本方案按整手交易演示，数量须为 100 股的整数倍。'
  if (quantity.value > limit.value) return side.value === 'buy' ? '委托金额超出当前账户可用资金。' : '委托数量超出当前账户可卖持仓。'
  return ''
})
const currentOrders = computed(() => orders.value.filter(o => o.account === accountId.value))
function selectRow(row) { if (row) selectedCode.value = row.code }
function resetTicket() { quantity.value = 0; fraction.value = 0; confirmOpen.value = false; confirmedOrder.value = null }
watch(selectedCode, () => { price.value = selected.value.price; resetTicket() })
watch(accountId, resetTicket)
watch(side, resetTicket)
watch(price, () => { fraction.value = 0; confirmOpen.value = false })
function setFraction(value) { quantity.value = Math.floor(limit.value * value / 100 / 100) * 100 }
function previewOrder() {
  if (validation.value) return
  confirmedOrder.value = { id: Date.now(), account: accountId.value, name: selected.value.name, code: selected.value.code, side: side.value, price: price.value, quantity: quantity.value, status: '模拟待报' }
  confirmOpen.value = true
}
function submitDemo() { orders.value.unshift({ ...confirmedOrder.value }); confirmOpen.value = false; tab.value = '委托'; quantity.value = 0; fraction.value = 0 }
const depths = [86, 55, 71, 34, 48]
</script>

<template>
  <main class="equity-draft">
    <header class="app-header">
      <img class="logo" src="/original-icons/logo-header.png" alt="FAUCON TRADE">
      <nav class="product-nav"><span class="active"><el-icon><TrendCharts /></el-icon>权益交易</span><span><el-icon><Document /></el-icon>期权交易</span><span><el-icon><DataAnalysis /></el-icon>数据中心</span></nav>
      <div class="header-right"><span class="draft-badge">方案初稿 · 演示环境</span><el-icon><Bell /></el-icon><span class="avatar">KZ</span><span>Kevin Zhang</span></div>
    </header>
    <div class="context-bar"><div><span class="workspace-name">交易工作台</span><span class="divider"></span><span class="muted">交易账户</span><el-select v-model="accountId" aria-label="交易账户" style="width: 202px"><el-option v-for="a in accounts" :key="a.id" :label="`${a.id} · ${a.name}`" :value="a.id" /></el-select><span class="account-scope"><el-icon><Connection /></el-icon>持仓与委托跟随当前账户</span></div><span class="session-state"><i class="status-dot" />行情快照 · 2026-09-08 14:38:26</span></div>
    <section class="summary-strip"><div><span>总资产 <small>CNY</small></span><strong>{{ money(account.cash + marketValue) }}</strong></div><div><span>可用资金 <small>CNY</small></span><strong>{{ money(account.cash) }}</strong></div><div><span>持仓市值 <small>CNY</small></span><strong>{{ money(marketValue) }}</strong></div><div><span>持仓浮动盈亏 <small>CNY</small></span><strong :class="pnl >= 0 ? 'up' : 'down'">{{ signed(pnl) }}</strong></div><div class="summary-note"><span>账户范围清晰 · 资金口径统一</span><small>金额按演示持仓计算，未计交易费用</small></div></section>
    <div class="trading-grid">
      <section class="panel portfolio">
        <div class="panel-tabs"><button v-for="t in ['持仓', '委托']" :key="t" :class="{ active: tab === t }" @click="tab = t">{{ t }}<small>{{ t === '持仓' ? rows.length : currentOrders.length }}</small></button><span class="panel-meta">{{ accountId }} · A 股</span></div>
        <template v-if="tab === '持仓'">
          <div class="table-tools"><el-input v-model="query" :prefix-icon="Search" placeholder="搜索标的名称 / 代码" clearable aria-label="搜索持仓" style="width: 220px" /><span class="muted">按标的汇总</span><span class="tag">人民币</span></div>
          <el-table :data="filtered" height="100%" row-key="code" :row-class-name="({row}) => row.code === selectedCode ? 'selected-row' : ''" @row-click="selectRow" empty-text="未找到匹配的持仓">
            <el-table-column label="标的 / 代码" min-width="132" fixed><template #default="{row}"><div class="symbol-cell"><strong>{{ row.name }}</strong><small>{{ row.code }}.{{ row.market }}</small></div></template></el-table-column>
            <el-table-column label="最新价" width="83" align="right"><template #default="{row}"><span :class="row.change >= 0 ? 'up' : 'down'">{{ money(row.price) }}</span></template></el-table-column>
            <el-table-column label="成本价" width="82" align="right"><template #default="{row}">{{ money(row.cost) }}</template></el-table-column>
            <el-table-column label="持仓 / 可卖" min-width="115" align="right"><template #default="{row}"><div class="quantity-cell">{{ number(row.qty) }}<small>{{ number(row.available) }}</small></div></template></el-table-column>
            <el-table-column label="浮动盈亏" min-width="110" align="right"><template #default="{row}"><div :class="row.price >= row.cost ? 'up' : 'down'">{{ signed((row.price-row.cost)*row.qty) }}<small class="pnl-percent">{{ signed((row.price/row.cost-1)*100) }}%</small></div></template></el-table-column>
            <el-table-column label="市值" min-width="108" align="right"><template #default="{row}">{{ money(row.price*row.qty) }}</template></el-table-column>
          </el-table>
          <div class="table-footer"><span>{{ filtered.length }} 个标的</span><span>点击持仓，联动右侧行情与委托</span></div>
        </template>
        <template v-else><div class="table-tools"><span>当前账户的模拟委托</span><span class="tag">未发送至交易系统</span></div><el-table :data="currentOrders" height="100%" empty-text="暂无模拟委托，完成右侧订单确认后将在此显示"><el-table-column prop="name" label="标的" /><el-table-column label="方向" width="65"><template #default="{row}"><span :class="row.side === 'buy' ? 'up':'down'">{{ row.side === 'buy' ? '买入':'卖出' }}</span></template></el-table-column><el-table-column prop="price" label="限价" /><el-table-column prop="quantity" label="数量" /><el-table-column prop="status" label="状态" /><el-table-column label="操作" width="70"><template #default="{row}"><el-button link :disabled="row.status === '已撤销'" @click="row.status='已撤销'">撤销</el-button></template></el-table-column></el-table><div class="table-footer">演示订单仅保留在当前页面中</div></template>
      </section>
      <section class="panel market-panel"><div class="panel-heading"><h2>行情</h2><span class="link-hint"><el-icon><Connection /></el-icon>已联动</span></div><div class="quote-hero"><div><h3>{{ selected.name }}</h3><span class="muted">{{ selected.code }}.{{ selected.market }} <span class="tag">A 股</span></span></div><div class="quote-price" :class="selected.change >= 0 ? 'up':'down'">{{ money(selected.price) }}<small>{{ selected.change >= 0 ? '↑':'↓' }} {{ Math.abs(selected.change).toFixed(2) }}%</small></div></div><div class="market-heading"><span>五档盘口</span><small>价格 CNY / 数量 股</small></div>
        <div class="depth-label"><span>卖盘</span><span>委托量</span></div>
        <button v-for="n in [5,4,3,2,1]" :key="`ask${n}`" class="depth-row" @click="price = Number((selected.price + n * .01).toFixed(2))"><span class="depth-bar ask" :style="{width: `${depths[n-1]}%`}" /><span class="depth-rank">卖 {{ n }}</span><b>{{ money(selected.price+n*.01) }}</b><span>{{ number(n*7800+1200) }}</span></button>
        <div class="spread"><span>买卖价差</span><strong>0.01 <small>CNY</small></strong></div>
        <button v-for="n in 5" :key="`bid${n}`" class="depth-row" @click="price = Number((selected.price - (n-1) * .01).toFixed(2))"><span class="depth-bar bid" :style="{width: `${depths[5-n]}%`}" /><span class="depth-rank">买 {{ n }}</span><b>{{ money(selected.price-(n-1)*.01) }}</b><span>{{ number(n*6500+1800) }}</span></button><div class="depth-note">点击盘口价格，填入限价委托</div>
        <div class="market-heading"><span>逐笔成交</span><small>主动买卖方向</small></div><div class="ticks-head"><span>时间</span><span>价格</span><span>数量 / 方向</span></div><div v-for="n in 5" :key="n" class="tick"><span>14:38:{{ 27-n }}</span><span>{{ money(selected.price) }}</span><span :class="n%2 ? 'up':'down'">{{ number(n*300) }} {{ n%2 ? '买':'卖' }}</span></div>
      </section>
      <section class="panel ticket"><div class="panel-heading"><h2>交易委托</h2><span class="tag">限价</span></div><div class="ticket-body"><div class="ticket-account"><span class="muted">下单账户</span><b>{{ accountId }}</b><small>{{ account.name }}</small></div><div class="ticket-symbol"><h3>{{ selected.name }}</h3><span>{{ selected.code }}.{{ selected.market }}</span></div><el-radio-group v-model="side" class="side-switch"><el-radio-button value="buy" label="buy">买入</el-radio-button><el-radio-button value="sell" label="sell">卖出</el-radio-button></el-radio-group>
        <div class="field-label"><label for="order-price">委托价格</label><span>CNY</span></div><el-input-number id="order-price" v-model="price" :precision="2" :step=".01" :min=".01" controls-position="right" /><div class="price-presets"><button @click="price = selected.price">买一 {{ money(selected.price) }}</button><button @click="price = Number((selected.price+.01).toFixed(2))">卖一 {{ money(selected.price+.01) }}</button></div>
        <div class="field-label"><label for="order-quantity">委托数量</label><span>股 · 100 股 / 手</span></div><el-input-number id="order-quantity" v-model="quantity" :step="100" :min="0" :precision="0" controls-position="right" @change="fraction=0" /><el-slider v-model="fraction" :step="25" :marks="{0:'0%',25:'25%',50:'50%',75:'75%',100:'100%'}" @input="setFraction" /><div class="capacity"><span>{{ side === 'buy' ? '按可买数量计算':'按可卖数量计算' }}</span><b>{{ number(limit) }} 股</b></div>
        <div class="order-estimate"><span>预计委托金额</span><strong>{{ money((price || 0)*(quantity || 0)) }} <small>CNY</small></strong><small>未含费用 · 以实际成交与清算为准</small></div><div class="validation" :class="{error: quantity > 0 && validation}">{{ validation || '数量与当前账户可用额度校验通过' }}</div><el-button class="submit-order" :class="side" :disabled="!!validation" @click="previewOrder">预览{{ side === 'buy' ? '买入':'卖出' }}订单</el-button><p class="ticket-footnote">下一步核对账户、方向、价格与数量</p>
        <div class="position-context"><span>当前标的持仓</span><div><span>持仓数量</span><b>{{ number(selected.qty) }} 股</b></div><div><span>可卖数量</span><b>{{ number(selected.available) }} 股</b></div></div>
      </div></section>
    </div>
    <footer class="app-status"><span><i class="status-dot" />演示环境 · 未连接交易服务</span><span>行情：静态快照</span><span>币种：CNY</span><span class="status-end">FAUCON TRADE · 工作台方案 V0.1</span></footer>
    <el-dialog v-model="confirmOpen" title="核对模拟委托" width="440px" align-center class="draft-confirm"><template v-if="confirmedOrder"><div class="confirm-direction" :class="confirmedOrder.side==='buy'?'up':'down'">{{ confirmedOrder.side==='buy'?'买入':'卖出' }} · {{ confirmedOrder.name }}</div><dl><dt>交易账户</dt><dd>{{ confirmedOrder.account }}</dd><dt>标的代码</dt><dd>{{ confirmedOrder.code }}</dd><dt>委托价格</dt><dd>{{ money(confirmedOrder.price) }} CNY</dd><dt>委托数量</dt><dd>{{ number(confirmedOrder.quantity) }} 股</dd><dt>预计金额</dt><dd>{{ money(confirmedOrder.price*confirmedOrder.quantity) }} CNY</dd></dl><p class="muted">本次仅生成演示记录，不会提交真实交易。</p></template><template #footer><el-button @click="confirmOpen=false">返回修改</el-button><el-button type="primary" @click="submitDemo">确认模拟委托</el-button></template></el-dialog>
  </main>
</template>
