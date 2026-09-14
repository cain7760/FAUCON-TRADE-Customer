<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { money, number } from '../variantData'
const props = defineProps({ symbol: Object, compact: Boolean })
defineEmits(['quote', 'drag'])
const widths = [35, 65, 41, 84, 56, 48, 72, 92, 61, 78]
const activeView = ref('depth')
const depthLevel = ref(10)
const ticks = ref([])
const displayTicks = computed(() => props.symbol?.code ? ticks.value : Array.from({ length: 17 }, (_, index) => ({ id: `empty-${index}` })))
let tickTimer

function priceDelta(symbol) { return Math.abs(symbol.price - symbol.cost).toFixed(2) }
function formatTickTime(time) { return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(time) }
function createTick(symbol, time = Date.now()) {
  const direction = Math.random() > .5 ? 'up' : 'down'
  const spread = Math.max(.01, symbol.price * .0008)
  const price = Math.max(.01, Math.round((symbol.price + (Math.random() * 2 - 1) * spread) * 100) / 100)
  return { id: `${time}-${Math.random()}`, time: formatTickTime(time), price, quantity: (Math.floor(Math.random() * 9) + 1) * 100, direction }
}
function resetTicks(symbol) {
  if (!symbol?.code) { ticks.value = []; return }
  const now = Date.now()
  ticks.value = Array.from({ length: 17 }, (_, index) => createTick(symbol, now - index * 900))
}
function appendTick() {
  if (!props.symbol?.code) return
  ticks.value = [createTick(props.symbol), ...ticks.value].slice(0, 17)
}
watch(() => props.symbol?.code, () => resetTicks(props.symbol), { immediate: true })
onMounted(() => { tickTimer = window.setInterval(appendTick, 900) })
onBeforeUnmount(() => window.clearInterval(tickTimer))
</script>
<template>
  <section class="book-pane workspace-panel">
    <header class="module-heading drag-heading" @pointerdown="$emit('drag', $event)"><span class="drag-title"><h2>订单簿</h2></span></header>
    <div class="book-scroll">
      <div class="book-quote"><strong>{{ symbol.code ? symbol.name : '请选择下单标的' }} <span v-if="symbol.code" class="book-symbol-code">{{ symbol.code }}{{ symbol.market }}</span></strong><div v-if="symbol.code" :class="symbol.change >= 0 ? 'up' : 'down'"><b>{{ money(symbol.price) }}</b><span>{{ symbol.change >= 0 ? '↑' : '↓' }} {{ priceDelta(symbol) }} {{ Math.abs(symbol.change).toFixed(2) }}%</span></div><div v-else class="book-empty-quote"><b>--</b><span>--</span></div></div>
      <div v-if="compact" class="book-view-tabs"><button :class="{active:activeView==='depth'}" @click="activeView='depth'">订单簿</button><button :class="{active:activeView==='ticks'}" @click="activeView='ticks'">逐笔成交</button></div>
      <div v-show="!compact || activeView==='depth'" class="book-depths"><div class="book-subtitle"><b>买卖盘</b><span class="depth-switch"><button :class="{active:depthLevel===10}" @click="depthLevel=10">十档</button><button :class="{active:depthLevel===5}" @click="depthLevel=5">五档</button></span></div><div class="book-column-head"><span>买盘</span><span>卖盘</span></div>
        <div v-for="n in depthLevel" :key="n" class="double-depth"><button :disabled="!symbol.code" @click="symbol.code && $emit('quote', { price: Number((symbol.price - (n-1)*.01).toFixed(2)), nonce: Date.now() })"><i v-if="symbol.code" :style="{width: `${widths[n-1]}%`}" /><span class="rank">{{ symbol.code ? n : '--' }}</span><b>{{ symbol.code ? money(symbol.price-(n-1)*.01) : '--' }}</b><span>{{ symbol.code ? number(n*6500+1800) : '--' }}</span></button><button :disabled="!symbol.code" @click="symbol.code && $emit('quote', { price: Number((symbol.price+n*.01).toFixed(2)), nonce: Date.now() })"><i v-if="symbol.code" :style="{width: `${widths[10-n]}%`}" /><span class="rank">{{ symbol.code ? n : '--' }}</span><b>{{ symbol.code ? money(symbol.price+n*.01) : '--' }}</b><span>{{ symbol.code ? number(n*7800+1200) : '--' }}</span></button></div>
        <div class="book-hint">{{ symbol.code ? '点击价格填入限价单' : '请选择下单标的' }}</div>
      </div>
      <div v-show="!compact || activeView==='ticks'" class="book-ticks"><div class="book-subtitle"><b>逐笔成交</b></div><div class="trade-tick tick-title"><span>时间</span><span>价格</span><span>数量(股)</span></div><div v-for="(tick, index) in displayTicks" :key="tick.id" class="trade-tick" :class="{ 'tick-live': symbol.code && index === 0 }"><span>{{ symbol.code ? tick.time : '--' }}</span><b :class="tick.direction">{{ symbol.code ? money(tick.price) : '--' }}</b><span :class="tick.direction">{{ symbol.code ? `${number(tick.quantity)} ${tick.direction === 'up' ? '↑' : '↓'}` : '--' }}</span></div></div>
    </div>
  </section>
</template>
