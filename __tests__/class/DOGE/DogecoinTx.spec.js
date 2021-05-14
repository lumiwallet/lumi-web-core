import Core from '@/class/Core'
import DogecoinTx from '@/class/DOGE/DogecoinTx'
import {calcBtcTxSize} from '@/helpers/coreHelper'
import * as mock from '@/../__mocks__/dogecoinTxMock.js'

describe('DogecoinTx class', () => {
  test('it should create a DogecoinTx class', () => {
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

    let Dogecoin = new DogecoinTx(data)

    expect(Dogecoin).toBeDefined()
  })

  test('it should create a DogecoinTx class with amount=1.5 and customFee=10', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 1.5,
      customFee: '10'
    }

    const expected_amount = 150000000
    const expected_custom_fee = 10

    const Dogecoin = new DogecoinTx(data)

    expect(Dogecoin).toBeDefined()
    expect(Dogecoin.amount).toBe(expected_amount)
    expect(Dogecoin.customFee).toBe(expected_custom_fee)
  })

  test('it should create empty fees list', async () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: mock.test_fees,
      amount: 1,
      customFee: 0
    }

    const Dogecoin = new DogecoinTx(data)
    const fees = await Dogecoin.calcFee()

    expect(fees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          DOGE: 0
        })
      ])
    )
  })

  test('it should calculate fees list for amount 0.05 DOGE', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.05,
      customFee: '10'
    }

    const Dogecoin = new DogecoinTx(data)
    const fees = await Dogecoin.calcFee()

    expect(fees[0].DOGE).toBe( 2.26328152) // for 1001452 sat pre byte
    expect(fees[1].DOGE).toBe(0.0000226) // for 10 sat pre byte
  })

  test('it should calculate empty fees list for amount 0.1 DOGE', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.1,
      customFee: 0
    }

    const Dogecoin = new DogecoinTx(data)
    const fees = await Dogecoin.calcFee()

    expect(fees[0].DOGE).toBe(2.26328152) // for 1001452 sat pre byte
    expect(fees[1].DOGE).toBe(0) // for custom fee
  })

  test('it should calculate fees list for all available amount (0.0134 DOGE)', async () => {
    const tx_size = calcBtcTxSize(mock.test_unspent.length, 1) // 340
    const available_amounts = mock.test_fees.map(item => { //  [  0.0133898 ]
      return (mock.test_balance - item.feePerByte * tx_size) / Math.pow(10, 8)
    })

    const data = available_amounts.map(amount => {
      return mock.getData({amount})
    })

    const fees = []

    for (let doge_data of data) {
      const Dogecoin = new DogecoinTx(doge_data)
      const fee = await Dogecoin.calcFee(tx_size)

      fees.push(fee)
    }

    expect(+(fees[0][0].DOGE + available_amounts[0]).toFixed(8)).toBe(mock.test_balance_doge)
  })

  test('it should make transaction in the amount of 1 DOGE on DGzBtLKz99rwrSfx9yRX1Z5vitEEw5kQio address', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'DOGE', type: ''}])

    const data = mock.getData({
      amount: 1,
      nodes: {
        external: CORE.COINS.DOGE.p2pkh.externalNode,
        internal: CORE.COINS.DOGE.p2pkh.internalNode
      }
    })

    const Dogecoin = new DogecoinTx(data)
    const fee_list = await Dogecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0]
    }

    const tx = await Dogecoin.make(tx_data)
    expect(tx).toEqual(mock.test_tx_data)

  })

  test('it should not make transaction in the amount of 50 DOGE and throw error \'err_tx_doge_balance: Insufficient balance\'', async () => {
    const data = mock.getData({amount: 50})

    const Dogecoin = new DogecoinTx(data)
    const fee_list = await Dogecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 1001452 sat pre byte
    }

    try {
      await Dogecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_doge_balance: Insufficient balance')
    }
  })

  test('it should not make transaction because amount is not valid', async () => {
    const data = mock.getData({amount: 'aaa'})
    const Dogecoin = new DogecoinTx(data)
    const fee_list = await Dogecoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 2 sat pre byte
    }

    try {
      await Dogecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_doge_amount: Invalid amount. Amount must be a Number')
    }
  })

  test('it should not make transaction because fee is not valid', async () => {
    const data = mock.getData({amount: 0.00001})
    const Dogecoin = new DogecoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: {}
    }

    try {
      await Dogecoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_doge_fee: Invalid fee. Fee must be a Object with \`SAT\` parameter')
    }
  })

  test('it should make transaction without a change (send all tx)', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'DOGE', type: ''}])

    const data = mock.getDataAllTx({
      amount: 1.39671848,
      nodes: {
        external: CORE.COINS.DOGE.p2pkh.externalNode,
        internal: CORE.COINS.DOGE.p2pkh.internalNode
      }
    })

    const Dogecoin = new DogecoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address_2,
      fee: mock.test_fee
    }

    const tx = await Dogecoin.make(tx_data)

    expect(tx).toBeDefined()
    expect(tx).toEqual(mock.test_send_all_tx_data)
  })
})
