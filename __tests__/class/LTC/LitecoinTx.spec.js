import Core from '@/class/Core'
import LitecoinTx from '@/class/LTC/LitecoinTx'
import {calcBtcTxSize} from '@/helpers/coreHelper'
import * as mock from '@/../__mocks__/litecoinTxMock.js'

describe('Litecoin class', () => {
  test('it should create a LitecoinTx class', () => {
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

    let Litecoin = new LitecoinTx(data)

    expect(Litecoin).toBeDefined()
  })

  test('it should create a BitcoinVaultTx class with amount=1.5 and customFee=10', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 1.5,
      customFee: '10'
    }

    const expected_amount = 150000000
    const expected_custom_fee = 10

    const Litecoin = new LitecoinTx(data)

    expect(Litecoin).toBeDefined()
    expect(Litecoin.amount).toBe(expected_amount)
    expect(Litecoin.customFee).toBe(expected_custom_fee)
  })

  test('it should create empty fees list', async () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: mock.test_fees,
      amount: 1,
      customFee: 0
    }

    const Litecoin = new LitecoinTx(data)
    const fees = await Litecoin.calcFee()

    expect(fees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          LTC: 0
        })
      ])
    )
  })

  test('it should calculate fees list for amount 0.00001 LTC', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.00001,
      customFee: '5'
    }

    const Litecoin = new LitecoinTx(data)
    const fees = await Litecoin.calcFee()

    expect(fees[0].LTC).toBe(0.00000429) // for 3 sat pre byte
    expect(fees[1].LTC).toBe(0.00000715) // for 5 sat pre byte
  })

  test('it should calculate empty fees list for amount 0.1 LTC', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.1,
      customFee: 0
    }

    const Litecoin = new LitecoinTx(data)
    const fees = await Litecoin.calcFee()

    expect(fees[0].LTC).toBe(0) // for 3 sat pre byte
    expect(fees[1].LTC).toBe(0) // for custom fee
  })

  test('it should calculate fees list for all available amount (0.00003 LTC)', async () => {
    const tx_size = calcBtcTxSize(mock.test_unspent.length, 1, true) // 111
    const available_amounts = mock.test_fees.map(item => { //  [  0.00002667 ]
      return (mock.test_balance - item.feePerByte * tx_size) / Math.pow(10, 8)
    })

    const data = available_amounts.map(amount => {
      return mock.getData({amount})
    })

    const fees = []

    for (let ltc_data of data) {
      const Litecoin = new LitecoinTx(ltc_data)
      const fee = await Litecoin.calcFee(tx_size)
      fees.push(fee)
    }

    expect(fees[0][0].LTC + available_amounts[0]).toBe(mock.test_balance_ltc)
  })

  test('it should make transaction in the amount of 0.001 LTC on ltc1q6laksq5nc8j5az67plynkrkvskxk7e2jgwu6ga address', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'LTC'}])

    const data = mock.getData({
      amount: 0.001,
      nodes: {
        external: CORE.COINS.LTC.p2wpkh.externalNode,
        internal: CORE.COINS.LTC.p2wpkh.internalNode
      }
    })

    const Litecoin = new LitecoinTx(data)
    const fee_list = await Litecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0]
    }

    const tx = await Litecoin.make(tx_data)
    expect(tx).toEqual(mock.test_send_tx_data)
  })

  test('it should not make transaction in the amount of 0.5 LTC and throw error \'err_tx_ltc_balance: Insufficient balance\'', async () => {
    const data = mock.getData({amount: 0.5})

    const Litecoin = new LitecoinTx(data)
    const fee_list = await Litecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }

    try {
      await Litecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_ltc_balance: Insufficient balance')
    }
  })

  test('it should not make transaction because amount is not valid', async () => {
    const data = mock.getData({amount: 'aaa'})
    const Litecoin = new LitecoinTx(data)
    const fee_list = await Litecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }

    try {
      await Litecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_ltc_amount: Invalid amount. Amount must be a Number')
    }
  })

  test('it should not make transaction because fee is not valid', async () => {
    const data = mock.getData({amount: 0.00001})
    const Litecoin = new LitecoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: {}
    }

    try {
      await Litecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_ltc_fee: Invalid fee. Fee must be a Object with \`SAT\` parameter')
    }
  })

  test('it should make transaction without a change (send all tx)', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'LTC'}])

    const data = mock.getDataTx({
      amount: 0.00099238,
      nodes: {
        external: CORE.COINS.LTC.p2wpkh.externalNode,
        internal: CORE.COINS.LTC.p2wpkh.internalNode
      }
    })
    const Litecoin = new LitecoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address_2,
      fee: mock.test_fee_2
    }
    const tx = await Litecoin.make(tx_data)
    expect(tx).toBeDefined()
    expect(tx).toEqual(mock.test_send_all_tx_data)
  })
})
