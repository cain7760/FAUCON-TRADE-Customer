// 期权生命周期 mock 数据（原型阶段，后续由 api/ 层替换）
// 结构：合约(contract) → 上手方(upstream) → 开/平仓记录(position)

export const LC = [
  {
    id: 'BB-20260801-001',
    underlying: '沪金 AU99.99',
    code: 'AU9999',
    type: '看涨期权',
    structure: '欧式看涨',
    rule: '现金结算',
    participation: '100%',
    strikePct: '102%',
    tenor: '1M',
    openDate: '2026-08-01',
    maturity: '2026-09-01',
    ccy: 'CNY',
    counterparty: '浙江宏远实业',
    upstreams: [
      {
        name: 'clsa_option',
        positions: [
          { backId: 'BB-20260801-001A', date: '2026-08-01', clientNotional: 300, upstreamNotional: 300, clientRate: '2.53%', upstreamRate: '2.24%', clientPrice: '12.62', upstreamPrice: '11.18', closeDate: '2026-08-15', clientClosePrice: '0.60', upstreamClosePrice: '0.50', clientSettle: 1.20, upstreamSettle: 1.00, openPnL: 0.87, closePnL: -0.20, clientPremium: 7.59, upstreamPremium: 6.72 },
          { backId: 'BB-20260801-001B', date: '2026-08-08', clientNotional: 200, upstreamNotional: 200, clientRate: '2.60%', upstreamRate: '2.30%', clientPrice: '13.05', upstreamPrice: '11.55', closeDate: null, clientClosePrice: null, upstreamClosePrice: null, clientSettle: null, upstreamSettle: null, openPnL: 0.60, closePnL: 0, clientPremium: 5.20, upstreamPremium: 4.60 }
        ],
        clientNotionalCurrent: 200,
        upstreamNotionalCurrent: 200,
        events: [
          { date: '2026-08-01', type: 'OPEN', ndc: 300, cp: '12.62', cc: 7.59, cm: 0.87, cu: -6.72, desc: '开仓 300万，客户期权价格 12.62', legs: [{ n: 'clsa_option', nd: 300, p: '11.18' }] },
          { date: '2026-08-08', type: 'ADD', ndc: 200, cp: '13.05', cc: 5.20, cm: 0.60, cu: -4.60, desc: '加仓 200万，客户期权价格 13.05', legs: [{ n: 'clsa_option', nd: 200, p: '11.55' }] },
          { date: '2026-08-15', type: 'REDUCE', ndc: -300, cp: '0.60', cc: -1.20, cm: -0.20, cu: 1.00, desc: '平仓 300万，客户结算 1.20万', legs: [{ n: 'clsa_option', nd: -300, p: '0.50' }] }
        ]
      },
      {
        name: 'cicc_option',
        positions: [
          { backId: 'BB-20260801-001C', date: '2026-08-01', clientNotional: 300, upstreamNotional: 300, clientRate: '2.53%', upstreamRate: '2.25%', clientPrice: '12.62', upstreamPrice: '11.20', closeDate: null, clientClosePrice: null, upstreamClosePrice: null, clientSettle: null, upstreamSettle: null, openPnL: 0.84, closePnL: 0, clientPremium: 7.59, upstreamPremium: 6.75 }
        ],
        clientNotionalCurrent: 300,
        upstreamNotionalCurrent: 300,
        events: [
          { date: '2026-08-01', type: 'OPEN', ndc: 300, cp: '12.62', cc: 7.59, cm: 0.84, cu: -6.75, desc: '开仓 300万，客户期权价格 12.62', legs: [{ n: 'cicc_option', nd: 300, p: '11.20' }] }
        ]
      }
    ]
  },
  {
    id: 'BB-20260715-018',
    underlying: '沪深300指数',
    code: '000300',
    type: '看跌期权',
    structure: '欧式看跌',
    rule: '现金结算',
    participation: '100%',
    strikePct: '100%',
    tenor: '2M',
    openDate: '2026-07-15',
    maturity: '2026-09-15',
    ccy: 'CNY',
    counterparty: '上海晟达资管',
    upstreams: [
      {
        name: 'cicc_option',
        positions: [
          { backId: 'BB-20260715-018A', date: '2026-07-15', clientNotional: 2000, upstreamNotional: 2000, clientRate: '3.10%', upstreamRate: '2.85%', clientPrice: '15.50', upstreamPrice: '14.25', closeDate: null, clientClosePrice: null, upstreamClosePrice: null, clientSettle: null, upstreamSettle: null, openPnL: 5.00, closePnL: 0, clientPremium: 62.00, upstreamPremium: 57.00 }
        ],
        clientNotionalCurrent: 2000,
        upstreamNotionalCurrent: 2000,
        events: [
          { date: '2026-07-15', type: 'OPEN', ndc: 2000, cp: '15.50', cc: 62.00, cm: 5.00, cu: -57.00, desc: '开仓 2000万，客户期权价格 15.50', legs: [{ n: 'cicc_option', nd: 2000, p: '14.25' }] }
        ]
      }
    ]
  },
  {
    id: 'BB-20260620-007',
    underlying: '螺纹钢 RB2410',
    code: 'RB2410',
    type: '看涨期权',
    structure: '欧式看涨',
    rule: '现金结算',
    participation: '100%',
    strikePct: '98%',
    tenor: '1M',
    openDate: '2026-06-20',
    maturity: '2026-07-20',
    ccy: 'CNY',
    counterparty: '宁波锦程贸易',
    upstreams: [
      {
        name: 'clsa_option',
        positions: [
          { backId: 'BB-20260620-007A', date: '2026-06-20', clientNotional: 700, upstreamNotional: 700, clientRate: '2.80%', upstreamRate: '2.60%', clientPrice: '14.00', upstreamPrice: '13.05', closeDate: '2026-07-20', clientClosePrice: '2.10', upstreamClosePrice: '2.05', clientSettle: 14.70, upstreamSettle: 14.35, openPnL: 1.40, closePnL: -0.35, clientPremium: 19.60, upstreamPremium: 18.20 }
        ],
        clientNotionalCurrent: 0,
        upstreamNotionalCurrent: 0,
        events: [
          { date: '2026-06-20', type: 'OPEN', ndc: 700, cp: '14.00', cc: 19.60, cm: 1.40, cu: -18.20, desc: '开仓 700万，客户期权价格 14.00', legs: [{ n: 'clsa_option', nd: 700, p: '13.05' }] },
          { date: '2026-07-20', type: 'CLOSE', ndc: -700, cp: '2.10', cc: -14.70, cm: -0.35, cu: 14.35, desc: '全部平仓 700万，客户结算 14.70万', legs: [{ n: 'clsa_option', nd: -700, p: '2.05' }] }
        ]
      },
      {
        name: 'cicc_option',
        positions: [
          { backId: 'BB-20260620-007B', date: '2026-06-20', clientNotional: 800, upstreamNotional: 800, clientRate: '2.80%', upstreamRate: '2.60%', clientPrice: '14.00', upstreamPrice: '13.00', closeDate: '2026-07-20', clientClosePrice: '2.10', upstreamClosePrice: '2.00', clientSettle: 16.80, upstreamSettle: 16.00, openPnL: 1.60, closePnL: -0.80, clientPremium: 22.40, upstreamPremium: 20.80 }
        ],
        clientNotionalCurrent: 0,
        upstreamNotionalCurrent: 0,
        events: [
          { date: '2026-06-20', type: 'OPEN', ndc: 800, cp: '14.00', cc: 22.40, cm: 1.60, cu: -20.80, desc: '开仓 800万，客户期权价格 14.00', legs: [{ n: 'cicc_option', nd: 800, p: '13.00' }] },
          { date: '2026-07-20', type: 'CLOSE', ndc: -800, cp: '2.10', cc: -16.80, cm: -0.80, cu: 16.00, desc: '全部平仓 800万，客户结算 16.80万', legs: [{ n: 'cicc_option', nd: -800, p: '2.00' }] }
        ]
      }
    ]
  }
]

export const STATUS = {
  holding: { label: '持仓中', cls: 'holding' },
  partial: { label: '部分平仓', cls: 'partial' },
  closed: { label: '已平仓', cls: 'closed' }
}

export const EVENT_TYPE = { OPEN: '开仓', ADD: '加仓', REDUCE: '减仓', CLOSE: '平仓' }

// 一个上手方（含多次开/平仓）的状态
export function upstreamStatus(u) {
  const anyOpen = u.positions.some((p) => !p.closeDate)
  const anyClosed = u.positions.some((p) => p.closeDate)
  return anyOpen && anyClosed ? 'partial' : anyClosed ? 'closed' : 'holding'
}
