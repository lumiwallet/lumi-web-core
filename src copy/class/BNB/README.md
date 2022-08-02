### Creating a BNB transaction
To create a Binance transaction you need to create a new class `BinanceTx` and call method `make`:
``` js
import BinanceTx from 'lumi-web-core'

const params = {
  account_number: 4065011,
  address: 'bnb18lv5tn4q...8x6cxanehc0q',
  balance: 0.0013,
  privateKey: '0b7a981a9e78be5fe1d...df0c86bbc16808a7a3c',
  publicKey: '032ccc39e75eb254e393fd5...a63ce29ca5c0a5c6193029e2241a',
  sequence: 0
}

let tx = new BinanceTx(params)
    
let tx_params = {
  addressTo: 'bnb18mtwnkyd9...vspmp2f2ak',
  amount: 0.001225,
  fee: 0.000075,
  memo: 'hello'
}
const raw_tx = tx.make(tx_params).serialize() // rawTx => 'd201f0625dee0a4a2a2c87fa0a...0d73656e6420616c6c20746573742001'
const hash = tx.getHash() // hash =>  '245CBADAE28CD4B9F401B4...277A3098395AD0319C0'
```
