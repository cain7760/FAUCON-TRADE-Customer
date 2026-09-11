import { positions } from './fixtures'
export const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const number = n => Number(n).toLocaleString('en-US')
export const variantRows = positions.map((p, i) => {
  const value = p.qty * p.price
  const floatingProfit = (p.price - p.cost) * p.qty
  // 演示字段：真实口径应由持仓接口提供，避免把展示计算当作交易规则。
  const dailyRealizedProfit = [0, -360, 180, 0, 520, 0, -240, 160, 0, -120, 80, 0][i]
  return {
    ...p,
    direction: '多',
    opening: i === 1 ? 50 : 0,
    value,
    valueWan: value / 10000,
    marginOccupied: value * 0.1,
    marginRate: 10,
    floatingProfit,
    dailyRealizedProfit,
    totalProfit: floatingProfit + dailyRealizedProfit,
    account: 'TZS_T0',
    id: `T0-${i}`,
  }
})
export const variants = [
  { id: 'classic', title: 'A · 经典三栏', description: '熟悉的操作动线，订单簿与下单并排', dock: 'right' },
  { id: 'table', title: 'B · 持仓优先', description: '完整表宽，下方集中行情与交易操作', dock: 'bottom' },
  { id: 'quick', title: 'C · 左侧快单', description: '左手交易、中央持仓、右侧行情', dock: 'left' },
]
