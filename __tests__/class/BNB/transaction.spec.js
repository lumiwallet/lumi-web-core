import BinanceTx from '@/class/BNB/transaction'

describe('BinanceTx class', () => {
  test('it should create a BinanceTx class', () => {
    const balance = 0.01656591 * Math.pow(10, 8)
    const data = {
      address: 'bnb18mtwnkyd9eqf7430xhtw5auvf30gvspmp2f2ak',
      account_number: 3780483,
      chain_id: 'Binance-Chain-Tigris',
      memo: 'Hello',
      sequence: 0,
      source: 1,
      fee: 7500,
    }
    
    let tx = new BinanceTx(data)
    console.log(tx)
    tx.make()
    expect(tx).toBeDefined()
  })
})
