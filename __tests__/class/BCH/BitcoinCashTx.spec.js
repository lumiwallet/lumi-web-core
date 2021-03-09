import Core from '@/class/Core'
import BitcoinCashTx from '@/class/BCH/BitcoinCashTx'
import {calcBtcTxSize} from '@/helpers/coreHelper'
import * as mock from '@/../__mocks__/bitcoinCashTxMock.js'

describe('BitcoinCashTx class', () => {
  test('it should create a BitcoinCashTx class', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 0,
      customFee: 0,
      nodes: {
        external: {},
        internal: {}
      }
    }

    let BitcoinCash = new BitcoinCashTx(data)

    expect(BitcoinCash).toBeDefined()
  })

  test('it should create a BitcoinCashTx class with amount=1.5 and customFee=10', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 1.5,
      customFee: '10'
    }

    const expected_amount = 150000000
    const expected_custom_fee = 10

    const BitcoinCash = new BitcoinCashTx(data)

    expect(BitcoinCash).toBeDefined()
    expect(BitcoinCash.amount).toBe(expected_amount)
    expect(BitcoinCash.customFee).toBe(expected_custom_fee)
  })

  test('it should create empty fees list', async () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: mock.test_fees,
      amount: 1,
      customFee: 0
    }

    const BitcoinCash = new BitcoinCashTx(data)
    const fees = await BitcoinCash.calcFee()

    expect(fees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          BCH: 0
        })
      ])
    )
  })

  test('it should calculate fees list for amount 0.0005 BCH', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.0005,
      customFee: '10'
    }

    const BitcoinCash = new BitcoinCashTx(data)
    const fees = await BitcoinCash.calcFee()

    expect(fees[0].BCH).toBe(0.00000678) // for 3 sat pre byte
    expect(fees[1].BCH).toBe(0.0000226) // for 10 sat pre byte
  })

  test('it should calculate empty fees list for amount 0.1 BCH', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.1,
      customFee: 0
    }

    const BitcoinCash = new BitcoinCashTx(data)
    const fees = await BitcoinCash.calcFee()

    expect(fees[0].BCH).toBe(0) // for 3 sat pre byte
    expect(fees[1].BCH).toBe(0) // for custom fee
  })

  test('it should calculate fees list for all available amount (0.0134 BCH)', async () => {
    const tx_size = calcBtcTxSize(mock.test_unspent.length, 1) // 340
    const available_amounts = mock.test_fees.map(item => { //  [  0.0133898 ]
      return (mock.test_balance - item.feePerByte * tx_size) / Math.pow(10, 8)
    })

    const data = available_amounts.map(amount => {
      return mock.getData({amount})
    })

    const fees = []

    for (let bch_data of data) {
      const BitcoinCash = new BitcoinCashTx(bch_data)
      const fee = await BitcoinCash.calcFee(tx_size)

      fees.push(fee)
    }

    expect(fees[0][0].BCH + available_amounts[0]).toBe(mock.test_balance_bch)
  })

  test('it should make transaction in the amount of 0.001 BCH on 115uEfQMqpZXWbbyLBqx9m9oa3szkoWm4e address', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'BCH', type: ''}])
  
    const data = mock.getData({
      amount: 0.001,
      nodes: {
        external: CORE.COINS.BCH.p2pkh.externalNode,
        internal: CORE.COINS.BCH.p2pkh.internalNode
      }
    })

    const BitcoinCash = new BitcoinCashTx(data)
    const fee_list = await BitcoinCash.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }

    const tx = await BitcoinCash.make(tx_data)
    expect(tx).toEqual(mock.test_tx_data)
  })

  test('it should not make transaction in the amount of 0.5 BCH and throw error \'err_tx_bch_balance: Insufficient balance\'', async () => {
    const data = mock.getData({amount: 0.5})

    const BitcoinCash = new BitcoinCashTx(data)
    const fee_list = await BitcoinCash.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 2 sat pre byte
    }

    try {
      await BitcoinCash.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_bch_balance: Insufficient balance')
    }
  })

  test('it should not make transaction because amount is not valid', async () => {
    const data = mock.getData({amount: 'aaa'})
    const BitcoinCash = new BitcoinCashTx(data)
    const fee_list = await BitcoinCash.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 2 sat pre byte
    }

    try {
      await BitcoinCash.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_bch_amount: Invalid amount. Amount must be a Number')
    }
  })

  test('it should not make transaction because fee is not valid', async () => {
    const data = mock.getData({amount: 0.00001})
    const BitcoinCash = new BitcoinCashTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: {}
    }

    try {
      await BitcoinCash.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_bch_fee: Invalid fee. Fee must be a Object with \`SAT\` parameter')
    }
  })
  
  test('it should make transaction without a change (send all tx)', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'BCH', type: ''}])

    const data = mock.getData({
      amount: 0.0133898,
      nodes: {
        external: CORE.COINS.BCH.p2pkh.externalNode,
        internal: CORE.COINS.BCH.p2pkh.internalNode
      }
    })

    const BitcoinCash = new BitcoinCashTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: mock.test_fee
    }
    
    const tx = await BitcoinCash.make(tx_data)
    
    expect(tx).toBeDefined()
    expect(tx).toEqual(mock.test_send_all_tx_data)
  })
})
