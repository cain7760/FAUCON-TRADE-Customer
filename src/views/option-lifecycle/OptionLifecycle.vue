<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { LC, STATUS, EVENT_TYPE, upstreamStatus } from './data'

const view = ref('detail')

// ---- 数字格式化 ----
const fmt = (n) => {
  if (n === null || n === undefined || n === '') return '—'
  const neg = n < 0
  const s = Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (neg ? '-' : '') + s
}
const fmtD = (n) => (n > 0 ? '+' + fmt(n) : fmt(n))
const signClass = (n) => (n > 0 ? 'num-pos' : n < 0 ? 'num-neg' : '')

// ---- 完整视图：扁平化 合约 → 上手方 → 记录 ----
const detailRows = LC.flatMap((c) =>
  c.upstreams.flatMap((u) =>
    u.positions.map((p) => ({
      contractId: c.id,
      underlying: c.underlying,
      code: c.code,
      type: c.type,
      tenor: c.tenor,
      strikePct: c.strikePct,
      counterparty: c.counterparty,
      ccy: c.ccy,
      upstream: u.name,
      clientCur: u.clientNotionalCurrent,
      upstreamCur: u.upstreamNotionalCurrent,
      backId: p.backId,
      clientNotional: p.clientNotional,
      upstreamNotional: p.upstreamNotional,
      clientRate: p.clientRate,
      upstreamRate: p.upstreamRate,
      clientPrice: p.clientPrice,
      upstreamPrice: p.upstreamPrice,
      closeDate: p.closeDate || '—',
      clientClosePrice: p.clientClosePrice ?? '—',
      upstreamClosePrice: p.upstreamClosePrice ?? '—',
      clientSettle: p.clientSettle,
      upstreamSettle: p.upstreamSettle,
      openPnL: p.openPnL,
      closePnL: p.closePnL,
      clientPremium: p.clientPremium,
      upstreamPremium: p.upstreamPremium
    }))
  )
)

// ---- span-method：合并合约列 + 上手方列 ----
const CONTRACT_COLS = ['underlying', 'tenor', 'strikePct', 'counterparty', 'ccy']
const UPSTREAM_COLS = ['upstream', 'clientCur', 'upstreamCur']

function spanMethod({ row, column, rowIndex }) {
  const key = column.property
  if (CONTRACT_COLS.includes(key)) {
    if (rowIndex > 0 && detailRows[rowIndex - 1].contractId === row.contractId) return { rowspan: 0, colspan: 0 }
    let span = 1
    while (rowIndex + span < detailRows.length && detailRows[rowIndex + span].contractId === row.contractId) span++
    return { rowspan: span, colspan: 1 }
  }
  if (UPSTREAM_COLS.includes(key)) {
    const upKey = (r) => r.contractId + '|' + r.upstream
    if (rowIndex > 0 && upKey(detailRows[rowIndex - 1]) === upKey(row)) return { rowspan: 0, colspan: 0 }
    let span = 1
    while (rowIndex + span < detailRows.length && upKey(detailRows[rowIndex + span]) === upKey(row)) span++
    return { rowspan: span, colspan: 1 }
  }
  return { rowspan: 1, colspan: 1 }
}

// ---- 简化视图：按合约聚合 ----
const simpleRows = LC.map((c) => {
  const allPos = c.upstreams.flatMap((u) => u.positions)
  const sum = (fn) => allPos.reduce((a, p) => a + (fn(p) || 0), 0)
  const anyOpen = allPos.some((p) => !p.closeDate)
  const anyClosed = allPos.some((p) => p.closeDate)
  const status = anyOpen && anyClosed ? 'partial' : anyClosed ? 'closed' : 'holding'
  return {
    id: c.id,
    underlying: c.underlying,
    openDate: c.openDate,
    counterparty: c.counterparty,
    clientPrice: allPos[0]?.clientPrice ?? '—',
    strikePct: c.strikePct,
    openCN: sum((p) => p.clientNotional),
    openUN: sum((p) => p.upstreamNotional),
    upstreamCount: c.upstreams.length,
    clientPremium: sum((p) => p.clientPremium),
    upstreamPremium: sum((p) => p.upstreamPremium),
    status,
    settleC: sum((p) => p.clientSettle),
    settleU: sum((p) => p.upstreamSettle)
  }
})

// ---- 详情抽屉 ----
const drawerVisible = ref(false)
const currentDetail = ref(null)
const statusOf = (u) => STATUS[upstreamStatus(u)]

function openDetail(row) {
  const c = LC.find((x) => x.id === row.contractId)
  const u = c?.upstreams.find((x) => x.name === row.upstream)
  if (!c || !u) return
  currentDetail.value = { c, u }
  drawerVisible.value = true
}

const detailKV = computed(() => {
  const { c, u } = currentDetail.value || {}
  if (!c || !u) return []
  const opensTotal = u.positions.reduce((a, p) => a + p.clientNotional, 0)
  const first = u.positions[0]
  return [
    ['标的名称 / 代码', `${c.underlying} / ${c.code}`],
    ['期权类型', c.type],
    ['期限', c.tenor],
    ['期权结构', c.structure],
    ['交易规则', c.rule],
    ['参与率', c.participation],
    ['交易对手', c.counterparty],
    ['上手方', u.name],
    ['客户期权费', first.clientRate],
    ['上手方期权费', first.upstreamRate],
    ['客户名义本金（期初）', `${fmt(opensTotal)} 万`],
    ['客户名义本金（当前）', `${fmt(u.clientNotionalCurrent)} 万`],
    ['结算货币', c.ccy]
  ]
})

const flowRows = computed(() => (currentDetail.value ? currentDetail.value.u.events : []))
const flowSummary = computed(() => {
  const evs = flowRows.value
  return {
    client: evs.reduce((a, e) => a + e.cc, 0),
    middle: evs.reduce((a, e) => a + e.cm, 0),
    up: evs.reduce((a, e) => a + e.cu, 0)
  }
})

function toast(text) {
  ElMessage({ message: `${text}（模拟下载）`, type: 'info' })
}
</script>

<template>
  <section class="lc-page">
    <div class="lc-header">
      <h2>期权生命周期 · 台账</h2>
      <div class="lc-header-right">
        <span class="lc-count">合约 {{ LC.length }} 份 · 上手方 {{ LC.reduce((a, c) => a + c.upstreams.length, 0) }} 个</span>
        <el-radio-group v-model="view" size="small">
          <el-radio-button label="detail">详细视图</el-radio-button>
          <el-radio-button label="simple">简化视图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 完整视图 -->
    <el-table v-if="view === 'detail'" :data="detailRows" :span-method="spanMethod" border size="small" class="lc-table">
      <el-table-column label="合约" align="center">
        <el-table-column label="期权信息" prop="underlying" min-width="150">
          <template #default="{ row }">
            <div class="cell-und">
              <span class="und-name">{{ row.underlying }}</span>
              <span class="und-code">{{ row.code }}</span>
              <span class="und-type">{{ row.type }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="期限" prop="tenor" width="60" align="center" />
        <el-table-column label="执行价(%)" prop="strikePct" width="90" align="right" />
        <el-table-column label="交易对手" prop="counterparty" min-width="110" />
        <el-table-column label="结算货币" prop="ccy" width="80" align="center" />
      </el-table-column>

      <el-table-column label="上手方" align="center">
        <el-table-column label="上手方" prop="upstream" min-width="100">
          <template #default="{ row }"><span class="up-name">{{ row.upstream }}</span></template>
        </el-table-column>
        <el-table-column label="客户当前名本" prop="clientCur" width="100" align="right">
          <template #default="{ row }"><span class="num-gold">{{ fmt(row.clientCur) }}</span></template>
        </el-table-column>
        <el-table-column label="上手当前名本" prop="upstreamCur" width="100" align="right">
          <template #default="{ row }"><span class="num-gold">{{ fmt(row.upstreamCur) }}</span></template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="开仓信息" align="center">
        <el-table-column label="背靠背编号" prop="backId" min-width="130">
          <template #default="{ row }"><span class="back-id">{{ row.backId }}</span></template>
        </el-table-column>
        <el-table-column label="客户期初名本" prop="clientNotional" width="100" align="right" :formatter="(r) => fmt(r.clientNotional)" />
        <el-table-column label="上手期初名本" prop="upstreamNotional" width="100" align="right" :formatter="(r) => fmt(r.upstreamNotional)" />
        <el-table-column label="客户期权费率" prop="clientRate" width="90" align="right" />
        <el-table-column label="上手期权费率" prop="upstreamRate" width="90" align="right" />
        <el-table-column label="客户开仓价" prop="clientPrice" width="90" align="right" />
        <el-table-column label="上手开仓价" prop="upstreamPrice" width="90" align="right" />
      </el-table-column>

      <el-table-column label="平仓信息" align="center">
        <el-table-column label="平仓日期" prop="closeDate" width="100" align="center" />
        <el-table-column label="客户平仓价" prop="clientClosePrice" width="90" align="right" />
        <el-table-column label="上手平仓价" prop="upstreamClosePrice" width="90" align="right" />
        <el-table-column label="客户结算金额" prop="clientSettle" width="100" align="right">
          <template #default="{ row }"><span :class="['num', signClass(-row.clientSettle)]">{{ row.clientSettle == null ? '—' : fmt(-row.clientSettle) }}</span></template>
        </el-table-column>
        <el-table-column label="上手结算金额" prop="upstreamSettle" width="100" align="right">
          <template #default="{ row }"><span :class="['num', signClass(row.upstreamSettle)]">{{ row.upstreamSettle == null ? '—' : '+' + fmt(row.upstreamSettle) }}</span></template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="中间账户" align="center">
        <el-table-column label="开仓收益" prop="openPnL" width="90" align="right">
          <template #default="{ row }"><span :class="['num', signClass(row.openPnL)]">{{ fmtD(row.openPnL) }}</span></template>
        </el-table-column>
        <el-table-column label="平仓收益" prop="closePnL" width="90" align="right">
          <template #default="{ row }"><span :class="['num', signClass(row.closePnL)]">{{ row.closePnL === 0 && row.closeDate === '—' ? '—' : fmtD(row.closePnL) }}</span></template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="期权费" align="center">
        <el-table-column label="客户期权金" prop="clientPremium" width="100" align="right" :formatter="(r) => fmt(r.clientPremium)" />
        <el-table-column label="上手期权金" prop="upstreamPremium" width="100" align="right" :formatter="(r) => fmt(r.upstreamPremium)" />
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button link size="small" @click="toast(`交易确认书 · ${row.backId}`)">确认书</el-button>
          <el-button link size="small" @click="toast(`估值报告 · ${row.backId}`)">估值</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 简化视图 -->
    <el-table v-else :data="simpleRows" border size="small" class="lc-table">
      <el-table-column label="背靠背编号" prop="id" min-width="130">
        <template #default="{ row }"><span class="back-id">{{ row.id }}</span></template>
      </el-table-column>
      <el-table-column label="事件编号" prop="id" min-width="130">
        <template #default="{ row }"><span class="back-id muted">{{ row.id }}</span></template>
      </el-table-column>
      <el-table-column label="标的" prop="underlying" min-width="120" />
      <el-table-column label="开仓日期" prop="openDate" width="100" align="center" />
      <el-table-column label="交易对手" prop="counterparty" min-width="110" />
      <el-table-column label="客户开仓价" prop="clientPrice" width="90" align="right" />
      <el-table-column label="执行价(%)" prop="strikePct" width="90" align="right" />
      <el-table-column label="客户期初名金" prop="openCN" width="100" align="right" :formatter="(r) => fmt(r.openCN)" />
      <el-table-column label="上手期初名本金" prop="openUN" width="110" align="right" :formatter="(r) => fmt(r.openUN)" />
      <el-table-column label="上手方数量" prop="upstreamCount" width="90" align="center" />
      <el-table-column label="客户期权费" prop="clientPremium" width="100" align="right" :formatter="(r) => fmt(r.clientPremium)" />
      <el-table-column label="上手期权费" prop="upstreamPremium" width="100" align="right" :formatter="(r) => fmt(r.upstreamPremium)" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }"><span class="tag" :class="STATUS[row.status].cls">{{ STATUS[row.status].label }}</span></template>
      </el-table-column>
      <el-table-column label="客户期权结算金额" prop="settleC" width="120" align="right" :formatter="(r) => (r.status === 'holding' ? '—' : fmt(r.settleC))" />
      <el-table-column label="上手期权结算金额" prop="settleU" width="120" align="right" :formatter="(r) => (r.status === 'holding' ? '—' : fmt(r.settleU))" />
    </el-table>
  </section>

  <!-- 详情抽屉 -->
  <el-drawer v-model="drawerVisible" :size="720" direction="rtl" class="lc-drawer" :with-header="false">
    <template v-if="currentDetail">
      <div class="drawer-head">
        <div class="drawer-title">
          <h2>{{ currentDetail.c.underlying }} · {{ currentDetail.c.type }}</h2>
          <span class="back-id">{{ currentDetail.c.id }}</span>
          <span class="drawer-sub">{{ currentDetail.c.counterparty }} / {{ currentDetail.u.name }}</span>
          <span class="tag" :class="statusOf(currentDetail.u).cls">{{ statusOf(currentDetail.u).label }}</span>
        </div>
        <div class="drawer-actions">
          <el-button type="primary" size="small" @click="toast('交易确认书')">交易确认书</el-button>
          <el-button size="small" @click="toast('估值报告')">估值报告</el-button>
          <button class="drawer-close" aria-label="关闭" @click="drawerVisible = false">×</button>
        </div>
      </div>
      <div class="drawer-body">
        <h3>① 期权要素</h3>
        <div class="kv-grid">
          <div v-for="[k, v] in detailKV" :key="k" class="kv"><div class="k">{{ k }}</div><div class="v">{{ v }}</div></div>
        </div>
        <h3>② 交易现金流 <span class="unit">现金流（本方方向）· 单位：万元</span></h3>
        <el-table :data="flowRows" border size="small" class="lc-table flow-table">
          <el-table-column label="日期" prop="date" width="100" align="center" />
          <el-table-column label="类型" prop="type" width="80" align="center">
            <template #default="{ row }"><span class="tag type" :class="'t-' + row.type.toLowerCase()">{{ EVENT_TYPE[row.type] }}</span></template>
          </el-table-column>
          <el-table-column label="名义本金变化" align="center">
            <el-table-column label="客户" width="90" align="right"><template #default="{ row }"><span :class="['num', signClass(row.ndc)]">{{ fmtD(row.ndc) }}</span></template></el-table-column>
            <el-table-column label="上手" width="90" align="right"><template #default="{ row }"><span :class="['num', signClass(row.ndc)]">{{ fmtD(row.ndc) }}</span></template></el-table-column>
          </el-table-column>
          <el-table-column label="价格" align="center">
            <el-table-column label="客户" prop="cp" width="80" align="right" />
            <el-table-column label="上手" width="80" align="right"><template #default="{ row }">{{ row.legs[0]?.p ?? '—' }}</template></el-table-column>
          </el-table-column>
          <el-table-column label="现金流（本方方向）" align="center">
            <el-table-column label="客户账户(CNY)" width="110" align="right"><template #default="{ row }"><span :class="['num', signClass(row.cc)]">{{ fmtD(row.cc) }}</span></template></el-table-column>
            <el-table-column label="中间账户(CNY)" width="110" align="right"><template #default="{ row }"><span :class="['num', signClass(row.cm)]">{{ fmtD(row.cm) }}</span></template></el-table-column>
            <el-table-column label="上手账户(CNY)" width="110" align="right"><template #default="{ row }"><span :class="['num', signClass(row.cu)]">{{ fmtD(row.cu) }}</span></template></el-table-column>
          </el-table-column>
        </el-table>
        <div class="flow-summary">
          汇总：客户 <b>{{ fmtD(flowSummary.client) }}</b> · 中间 <b>{{ fmtD(flowSummary.middle) }}</b> · 上手 <b>{{ fmtD(flowSummary.up) }}</b>
          <span class="ok" v-if="Math.abs(flowSummary.client + flowSummary.up - flowSummary.middle) < 0.01">✓ 资金守恒</span>
          <span class="bad" v-else>✗ 不平</span>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.lc-page { height: 100%; display: flex; flex-direction: column; background: #0d1118; color: #a4b1c3; }
.lc-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 10px; }
.lc-header h2 { margin: 0; color: #f4f7fb; font-size: 16px; font-weight: 600; }
.lc-header-right { display: flex; align-items: center; gap: 14px; }
.lc-count { color: #6b7787; font-size: 12px; }

/* el-table 暗色主题覆盖 */
.lc-table { --el-table-bg-color: #11161d; --el-table-tr-bg-color: #11161d; --el-table-header-bg-color: #181f29; --el-table-border-color: #222b36; --el-table-row-hover-bg-color: #1a2230; --el-table-text-color: #a4b1c3; --el-table-header-text-color: #8b98a9; }
.lc-table :deep(.el-table__header th) { font-weight: 600; }
.lc-table :deep(.el-table__header .el-table__cell) { background: #181f29; }
.lc-table :deep(.el-table__body .el-table__cell) { background: #11161d; }
.lc-table :deep(.el-table__inner-wrapper::before) { background: #222b36; }
.lc-table :deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1c2530; }

.cell-und { display: flex; flex-direction: column; line-height: 1.4; }
.und-name { color: #e6ebf2; font-weight: 600; }
.und-code { color: #bb984a; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.und-type { color: #6b7787; font-size: 11px; }
.up-name { color: #cbd5e1; }
.back-id { font-family: 'JetBrains Mono', monospace; color: #8fa0b5; font-size: 12px; }
.back-id.muted { color: #5c6878; }
.num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.num-gold { color: #bb984a; font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.num-pos { color: var(--ft-color-down); }
.num-neg { color: var(--ft-color-up); }

.tag { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
.tag.holding { background: rgba(74, 130, 196, 0.16); color: #6ea8dc; }
.tag.partial { background: rgba(200, 136, 46, 0.18); color: #d9a04a; }
.tag.closed { background: rgba(128, 128, 128, 0.16); color: #8b98a9; }
.tag.type.t-open { background: var(--ft-color-down-surface); color: var(--ft-color-down); }
.tag.type.t-add { background: rgba(74, 130, 196, 0.16); color: #6ea8dc; }
.tag.type.t-reduce { background: rgba(200, 136, 46, 0.18); color: #d9a04a; }
.tag.type.t-close { background: rgba(128, 128, 128, 0.16); color: #8b98a9; }

/* 抽屉 */
.drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #222b36; }
.drawer-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.drawer-title h2 { margin: 0; color: #f4f7fb; font-size: 15px; }
.drawer-actions { display: flex; align-items: center; gap: 8px; }
.drawer-close { width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 4px; background: transparent; color: #8b98a9; font-size: 20px; cursor: pointer; }
.drawer-close:hover { background: #222b36; color: #e6ebf2; }
.drawer-sub { color: #6b7787; font-size: 12px; }
.drawer-body { padding: 16px 20px; }
.drawer-body h3 { margin: 0 0 10px; color: #e6ebf2; font-size: 13px; }
.drawer-body .unit { color: #6b7787; font-size: 11px; font-weight: 400; }
.kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); border: 1px solid #222b36; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
.kv { display: flex; padding: 9px 14px; border-bottom: 1px solid #1c2530; font-size: 12px; }
.kv:nth-last-child(-n+2) { border-bottom: none; }
.kv .k { width: 150px; color: #6b7787; flex-shrink: 0; }
.kv .v { color: #cbd5e1; font-variant-numeric: tabular-nums; }
.flow-table { margin-bottom: 10px; }
.flow-summary { font-size: 12px; color: #6b7787; }
.flow-summary b { color: #bb984a; font-family: 'JetBrains Mono', monospace; }
.flow-summary .ok { color: var(--ft-color-down); margin-left: 10px; }
.flow-summary .bad { color: var(--ft-color-up); margin-left: 10px; }
</style>

<style>
/* el-drawer 被 teleport 到 body，需全局样式覆盖暗色背景 */
.lc-drawer.el-drawer { --el-drawer-bg-color: #11161d; }
.lc-drawer .el-drawer__body { padding: 0; color: #a4b1c3; }
</style>
