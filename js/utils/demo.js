// js/utils/demo.js
export const DEMO = {
  label: 'ДЕМО',
  currencyRates: {
    date: '01.01.2025',
    rates: {
      USD: { value: 92.50, nominal: 1, unitRate: 92.50 },
      EUR: { value: 100.10, nominal: 1, unitRate: 100.10 },
      CNY: { value: 12.80, nominal: 1, unitRate: 12.80 }
    }
  },
  keyRate: { rate: 21.0, date: '28.10.2024' },
  metals: [
    { code: '1', sell: '8 250,00' },
    { code: '2', sell: '95,40' },
    { code: '3', sell: '2 780,00' },
    { code: '4', sell: '2 950,00' }
  ],
  stocks: [
    { secid: 'SBER', name: 'Сбербанк', last: 285.4, change: 1.2, percent: 0.42 },
    { secid: 'GAZP', name: 'Газпром', last: 132.7, change: -0.8, percent: -0.60 },
    { secid: 'LKOH', name: 'Лукойл', last: 6840, change: 25, percent: 0.37 }
  ],
  indices: [
    { secid: 'IMOEX', name: 'Индекс МосБиржи', last: 3120.5, change: 12.4, percent: 0.40 },
    { secid: 'RTSI',  name: 'Индекс РТС',      last: 1085.2, change: -5.1, percent: -0.47 }
  ]
};