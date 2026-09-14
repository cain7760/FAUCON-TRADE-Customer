<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, CircleClose, InfoFilled } from '@element-plus/icons-vue'
import { money, number } from '../variantData'
const props = defineProps({ instruments: Array, accounts: Array, symbol: Object, account: Object, quote: Object, paused: Boolean })
const emit = defineEmits(['select', 'account-select', 'order'])
const orderType = ref('limit'), price = ref(props.symbol.price), quantity = ref(0), amount = ref(0), quantityMode = ref('quantity'), fraction = ref(0)
const symbolMarket = ref('ALL'), search = ref(''), unit = ref('shares'), amountUnit = ref('yuan'), confirming = ref(false), insufficientFunds = ref(false), snapshot = ref(null)
const instrumentSelect = ref(null), instrumentPopperWidth = ref(0)
const quantityInputKey = ref(0)
const displaySymbolCode = ref(props.symbol.code)
const recentCodes = ref([props.symbol.code, '600036', '300750', '600519'])
const symbols = computed(() => props.instruments.filter(p => (symbolMarket.value === 'ALL' || (symbolMarket.value === 'A' ? ['SZ', 'SH'].includes(p.market) : p.market === 'HK')) && `${p.name}${p.code}`.toLowerCase().includes(search.value.toLowerCase())))
const recentSymbols = computed(() => recentCodes.value.map(code => props.instruments.find(item => item.code === code)).filter(Boolean))
const estimatedPrice = computed(() => orderType.value === 'limit' ? price.value : props.symbol.price)
const displayedAmount = computed({
  get: () => amount.value == null ? undefined : amountUnit.value === 'wan' ? amount.value / 10000 : amount.value,
  set: value => { amount.value = (Number(value) || 0) * (amountUnit.value === 'wan' ? 10000 : 1) },
})
const priceInvalid = computed(() => orderType.value === 'limit' && price.value === 0)
const shares = computed(() => quantityMode.value === 'amount' ? Math.floor((amount.value || 0) / estimatedPrice.value / 100) * 100 : (quantity.value || 0) * (unit.value === 'wan' ? 10000 : 1))
const lotInvalid = computed(() => quantityMode.value === 'quantity' && unit.value === 'shares' && quantity.value > 0 && quantity.value % 100 !== 0)
const maxBuy = computed(() => estimatedPrice.value > 0 ? Math.floor(props.account.cash / estimatedPrice.value / 100) * 100 : 0)
const maxSell = computed(() => Math.max(0, props.symbol.available))
const commonValid = computed(() => !!displaySymbolCode.value && shares.value > 0 && shares.value % 100 === 0 && (orderType.value === 'market' || price.value > 0))
const canBuy = computed(() => !props.paused && commonValid.value)
const canSell = computed(() => !props.paused && commonValid.value)
function reset() { quantity.value = undefined; amount.value = undefined; fraction.value = 0; confirming.value = false }
function chooseSymbol(code) { if (code) { displaySymbolCode.value = code; emit('select', code) } }
function clearInstrument() { displaySymbolCode.value = null; search.value = ''; price.value = null; fraction.value = 0; confirming.value = false; nextTick(() => { quantity.value = undefined; amount.value = undefined; quantityInputKey.value += 1 }) }
function handleInstrumentVisible(visible) { if (visible) { search.value = ''; nextTick(() => { instrumentPopperWidth.value = Math.round(instrumentSelect.value?.$el?.getBoundingClientRect().width || 0) }) } }
watch(() => props.symbol.code, code => { displaySymbolCode.value = code; recentCodes.value = [code, ...recentCodes.value.filter(item => item !== code)].slice(0, 4); price.value = props.symbol.price; reset() })
watch(() => props.account.id, reset)
watch([orderType, unit, quantityMode], reset)
watch(() => props.quote, value => { if (value) { orderType.value = 'limit'; price.value = value.price } })
watch(price, () => { fraction.value = 0; confirming.value = false })
function size(value) { const q = Math.floor(maxBuy.value * value / 100 / 100) * 100; if (quantityMode.value === 'amount') amount.value = Number((q * estimatedPrice.value).toFixed(2)); else quantity.value = unit.value === 'wan' ? Math.floor(q / 10000) : q }
function stepPrice(direction) { const current = Number(price.value) || 0; price.value = Number((Math.max(0, current + direction * .01)).toFixed(2)) }
function preview(side) {
  if (props.paused) return
  if (!(side === 'buy' ? canBuy.value : canSell.value)) return
  if (side === 'buy' && estimatedPrice.value * shares.value > props.account.cash) { insufficientFunds.value = true; return }
  const id = Date.now()
  snapshot.value = { id, orderNo: `WT${id}`, account: props.account.id, code: props.symbol.code, name: props.symbol.name, type: orderType.value, side, quantity: shares.value, price: orderType.value === 'limit' ? price.value : null, estimate: estimatedPrice.value * shares.value, status: '待报', runStatus: '运行中', openClose: '开', attribute: `${orderType.value === 'limit' ? '限价' : '市价'}·${quantityMode.value === 'quantity' ? '数量' : '金额'}`, orderValueNumber: quantityMode.value === 'quantity' ? shares.value : amount.value, orderValue: quantityMode.value === 'quantity' ? `${number(shares.value)} 股` : `${money(amount.value || 0)} CNY`, filledQuantity: 0, filledPrice: null }
  confirming.value = true
}
function submit() { if (props.paused) { confirming.value = false; return }; emit('order', { ...snapshot.value }); reset() }
</script>

<template>
  <div class="order-form" :class="{ 'is-paused': paused }">
    <p v-if="paused" class="order-paused-notice">系统中断中，暂不支持下单</p>
    <section class="order-account-block">
      <div class="field-caption"><span>下单账户</span></div>
      <el-select :model-value="account.id" @update:model-value="id => emit('account-select', id)" aria-label="下单账户" popper-class="variant-popper"><el-option v-for="item in accounts" :key="item.id" :label="`${item.id}·${item.name}`" :value="item.id" /></el-select>
    </section>
    <section class="order-type-row"><el-radio-group v-model="orderType" class="order-type"><el-radio-button label="limit">限价</el-radio-button><el-radio-button label="market">市价</el-radio-button></el-radio-group></section>
    <section class="order-symbol-block">
      <div class="field-caption"><span>下单标的</span><div class="symbol-tags"><span>CNY</span><el-tooltip content="40% IA"><span>40% IA</span></el-tooltip></div></div>
      <div class="instrument-select-wrap"><el-select ref="instrumentSelect" v-model="displaySymbolCode" filterable :filter-method="v => search = v" @visible-change="handleInstrumentVisible" @change="chooseSymbol" :popper-style="instrumentPopperWidth ? { width: `${instrumentPopperWidth}px`, minWidth: `${instrumentPopperWidth}px` } : undefined" placeholder="搜索标的名称 / 代码" aria-label="下单标的" class="instrument-select" popper-class="variant-popper instrument-popper" placement="bottom-start" :offset="4">
        <template #header><div class="instrument-select-header"><b>搜索标的</b><div v-if="recentSymbols.length" class="instrument-history"><span>搜索历史</span><div><button v-for="item in recentSymbols" :key="item.code" type="button" @mousedown.prevent @click.stop="chooseSymbol(item.code)">{{ item.name }}（{{ item.code }}）</button></div></div><div class="instrument-market-tabs"><button v-for="item in [['ALL','全部'],['A','A股'],['HK','港股']]" :key="item[0]" type="button" :class="{ active: symbolMarket === item[0] }" @mousedown.prevent @click="symbolMarket = item[0]">{{ item[1] }}</button></div></div></template>
        <el-option v-for="s in symbols" :key="s.code" :label="`${s.name}（${s.code}）`" :value="s.code"><span class="instrument-option-label">{{ s.name }}（{{ s.code }}）</span></el-option>
      </el-select><button v-if="displaySymbolCode" type="button" class="symbol-clear-button" aria-label="清空下单标的" title="清空下单标的" @click.stop="clearInstrument"><el-icon><CircleClose /></el-icon></button></div>
    </section>
    <section class="price-block">
      <template v-if="orderType === 'limit'"><div class="field-caption"><label for="variant-price">委托价格</label></div><div class="price-input-row" :class="{ 'is-error': priceInvalid }"><el-input-number id="variant-price" v-model="price" placeholder="请输入" :step=".01" :precision="2" :controls="false" /><span class="price-stepper"><button type="button" aria-label="增加委托价格" @click="stepPrice(1)"><el-icon><ArrowUp /></el-icon></button><button type="button" aria-label="减少委托价格" @click="stepPrice(-1)"><el-icon><ArrowDown /></el-icon></button></span></div><span v-if="priceInvalid" class="price-error">委托价格不可为0，请重试</span></template>
      <template v-else><div class="field-caption"><span>委托价格</span></div><div class="market-price-note"><b>以市场价格成交</b></div></template>
    </section>
    <section class="quantity-block">
      <div class="field-caption"><label :for="quantityMode === 'quantity' ? 'variant-quantity' : 'variant-amount'">{{ quantityMode === 'quantity' ? '委托数量' : '委托金额' }}</label><el-radio-group v-model="quantityMode" class="quantity-mode" size="small"><el-radio-button label="quantity">数量</el-radio-button><el-radio-button label="amount">金额</el-radio-button></el-radio-group></div>
      <template v-if="quantityMode === 'quantity'"><div class="quantity-input-row" :class="{ 'is-error': lotInvalid }"><el-input-number :key="quantityInputKey" id="variant-quantity" v-model="quantity" placeholder="请输入" :step="unit === 'wan' ? 1 : 100" :precision="0" :controls="false" /><el-select v-model="unit" aria-label="数量单位" popper-class="variant-popper quantity-unit-popper" placement="bottom-end" :offset="4" :class="{ 'is-wan-unit': unit === 'wan' }"><el-option label="股" value="shares" /><el-option label="万股" value="wan" /></el-select></div><span v-if="lotInvalid" class="lot-error">委托数量须为整手，请重新输入</span></template>
      <div v-else class="quantity-input-row amount-input-row"><el-input-number :key="quantityInputKey" id="variant-amount" v-model="displayedAmount" placeholder="请输入" :step="amountUnit === 'wan' ? 1 : 1000" :precision="2" :controls="false" /><el-select v-model="amountUnit" aria-label="金额单位" popper-class="variant-popper quantity-unit-popper" placement="bottom-end" :offset="4" :class="{ 'is-wan-unit': amountUnit === 'wan' }"><el-option label="元" value="yuan" /><el-option label="万元" value="wan" /></el-select></div>
      <el-slider v-model="fraction" :step="1" :marks="{0:'0%',25:'25%',50:'50%',75:'75%',100:'100%'}" @input="size" />
      <div class="capacity-pair"><div>最大可买<b>{{ number(maxBuy) }} 股</b></div><div>最大可卖<b>{{ number(maxSell) }} 股</b></div></div>
    </section>
    <section class="submit-block"><div class="trade-buttons"><el-button class="buy-action" :disabled="!canBuy" @click="preview('buy')">买入</el-button><el-button class="sell-action" :disabled="!canSell" @click="preview('sell')">卖出</el-button></div><div class="order-totals"><div class="total-item"><span>买入预估(股)</span><b>{{ shares ? number(shares) : '--' }}</b></div><div class="total-item"><div class="total-heading"><span>卖出预估(股)</span><el-tooltip content="在数量下单模式下，为下单股数；在金额下单模式下，为委托金额/持仓均价。金额委托下的卖出，是针对剩余可卖出总名义本金比例的股数卖出，而非实际到账金额。" placement="top" popper-class="order-help-popper"><button type="button" class="total-help" aria-label="卖出预估说明"><el-icon><InfoFilled /></el-icon></button></el-tooltip></div><b>{{ shares ? number(shares) : '--' }}</b></div><div class="total-item"><span>买入金额(CNY)</span><b>{{ shares ? money(shares * (estimatedPrice || 0)) : '--' }}</b></div><div class="total-item"><div class="total-heading"><span>预估卖出金额(CNY)</span><el-tooltip content="卖出金额(预估)=卖出预估(股数)×委托价格。限价模式为预估最大回款金额；市价模式下此值仅供参考，以实际成交情况为准。" placement="top" popper-class="order-help-popper"><button type="button" class="total-help" aria-label="预估卖出金额说明"><el-icon><InfoFilled /></el-icon></button></el-tooltip></div><b>{{ shares ? money(shares * (estimatedPrice || 0)) : '--' }}</b></div></div><div class="total-notional"><div class="total-heading"><span>卖出名义本金(CNY)</span><el-tooltip content="金额模式下的卖出金额是指需要卖出的名义本金，而非实际回款金额。" placement="top" popper-class="order-help-popper"><button type="button" class="total-help" aria-label="卖出名义本金说明"><el-icon><InfoFilled /></el-icon></button></el-tooltip></div><b>{{ shares ? money(shares * (estimatedPrice || 0)) : '--' }}</b></div></section>
  </div>
  <el-dialog v-model="confirming" title="确认委托" width="460px" align-center append-to-body class="variant-confirm order-confirm"><template v-if="snapshot"><div class="confirm-identity" :class="snapshot.side"><span>{{ snapshot.side === 'buy' ? '买入' : '卖出' }}</span><strong>{{ snapshot.name }}</strong><small>{{ snapshot.code }}</small></div><div class="confirm-key-metrics"><div><span>委托价格</span><b>{{ snapshot.type === 'limit' ? money(snapshot.price) : '市价' }}</b><small>{{ snapshot.type === 'limit' ? 'CNY' : '以市场价格成交' }}</small></div><div><span>委托数量</span><b>{{ number(snapshot.quantity) }}</b><small>股</small></div><div><span>预计金额</span><b>{{ money(snapshot.estimate) }}</b><small>CNY</small></div></div><dl class="confirm-details"><dt>交易账户</dt><dd>{{ snapshot.account }}</dd><dt>订单类型</dt><dd>{{ snapshot.type === 'limit' ? '限价单' : '市价单' }}</dd></dl><p class="confirm-disclaimer">当前原型未连接券商交易通道，确认后仅保留本地委托记录。{{ snapshot.type === 'market' ? '市价成交金额以实际成交为准。' : '' }}</p></template><template #footer><el-button @click="confirming = false">返回修改</el-button><el-button type="primary" @click="submit">确认委托</el-button></template></el-dialog>
  <el-dialog v-model="insufficientFunds" title="可用余额不足" width="380px" align-center append-to-body class="variant-confirm insufficient-funds"><div class="balance-compare"><div><span>本次买入预计需</span><b>{{ money(shares * (estimatedPrice || 0)) }}</b><small>CNY</small></div><div><span>账户可用余额</span><b>{{ money(account.cash) }}</b><small>CNY</small></div></div><p class="dim">请降低委托数量或委托价格后重试。</p><template #footer><el-button type="primary" @click="insufficientFunds = false">我知道了</el-button></template></el-dialog>
</template>
