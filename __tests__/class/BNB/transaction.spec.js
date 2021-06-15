import BinanceTx from '@/class/BNB/transaction'

describe('BinanceTx class', () => {
  test('it should create a BinanceTx class and make transaction', async () => {
    const params = {
      account_number: 4065011,
      address: 'bnb18lv5tn4q4f75yg9hvyfg30xq448x6cxanehc0q',
      balance: 0.0013,
      fee: [],
      privateKey: '0b7a981a9e78be5fe1d2bcb291924f03f09ab1e88bd8bdf0c86bbc16808a7a3c',
      publicKey: '032ccc39e75eb254e393fd5597da80894c5080a63ce29ca5c0a5c6193029e2241a',
      sequence: 0
    }
    
    let tx = new BinanceTx(params)
    
    let txParams = {
      addressTo: 'bnb18mtwnkyd9eqf7430xhtw5auvf30gvspmp2f2ak',
      amount: 0.001225,
      fee: 0.000075,
      memo: 'send all test'
    }
    const rawTx = tx.make(txParams).serialize()
    const hash = tx.getHash()
    const expectedRawTx = 'd201f0625dee0a4a2a2c87fa0a210a143fd945cea0aa7d4220b7611288bcc0ad4e6d60dd12090a03424e421084bd0712210a143ed6e9d88d2e409f562f35d6ea778c4c5e86403b12090a03424e421084bd07126f0a26eb5ae98721032ccc39e75eb254e393fd5597da80894c5080a63ce29ca5c0a5c6193029e2241a12404fa7d00bbcfcbd625212f2ea135294f9b2842d9d4436a82567a4dd431b85997b5408f4fc3aa7f40baf9f87b18c88d4d891d79f7fa86ea695ebaf76494b5243d218f38df8011a0d73656e6420616c6c20746573742001'
    const expectedHash = '245CBADAE28CD4B9F401B443822698703292214D82FA3277A3098395AD0319C0'
    
    expect(tx).toBeDefined()
    expect(rawTx).toEqual(expectedRawTx)
    expect(hash).toEqual(expectedHash)
  })
})
