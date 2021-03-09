import Core from '@/class/Core'
import BitcoinVaultTx from '@/class/BTCV/BitcoinVaultTx'
import {calcBtcTxSize} from '@/helpers/coreHelper'
import * as mock from '@/../__mocks__/bitcoinVaultTxMock.js'

describe('BitcoinCashTx class', () => {
  test('it should create a BitcoinVaultTx class', () => {
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
    
    let BitcoinVault = new BitcoinVaultTx(data)

    expect(BitcoinVault).toBeDefined()
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
    
    const BitcoinVault = new BitcoinVaultTx(data)
    
    expect(BitcoinVault).toBeDefined()
    expect(BitcoinVault.amount).toBe(expected_amount)
    expect(BitcoinVault.customFee).toBe(expected_custom_fee)
  })
  
  test('it should create empty fees list', async () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: mock.test_fees,
      amount: 1,
      customFee: 0
    }
    
    const BitcoinVault = new BitcoinVaultTx(data)
    const fees = await BitcoinVault.calcFee()

    expect(fees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          BTCV: 0
        })
      ])
    )
  })
  
  test('it should calculate fees list for amount 0.00001 BTCV', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.00001,
      customFee: '5'
    }
    
    const BitcoinVault = new BitcoinVaultTx(data)
    const fees = await BitcoinVault.calcFee()
    
    expect(fees[0].BTCV).toBe(0.00000429) // for 3 sat pre byte
    expect(fees[1].BTCV).toBe(0.00000715) // for 5 sat pre byte
  })
  
  test('it should calculate empty fees list for amount 0.1 BTCV', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.1,
      customFee: 0
    }
    
    const BitcoinVault = new BitcoinVaultTx(data)
    const fees = await BitcoinVault.calcFee()
    
    expect(fees[0].BTCV).toBe(0) // for 3 sat pre byte
    expect(fees[1].BTCV).toBe(0) // for custom fee
  })
  
  test('it should calculate fees list for all available amount (0.00003 BTCV)', async () => {
    const tx_size = calcBtcTxSize(mock.test_unspent.length, 1, true) // 111
    const available_amounts = mock.test_fees.map(item => { //  [  0.00002667 ]
      return (mock.test_balance - item.feePerByte * tx_size) / Math.pow(10, 8)
    })
    
    const data = available_amounts.map(amount => {
      return mock.getData({amount})
    })
    
    const fees = []
    
    for (let btcv_data of data) {
      const BitcoinVault = new BitcoinVaultTx(btcv_data)
      const fee = await BitcoinVault.calcFee(tx_size)
      fees.push(fee)
    }
    
    expect(fees[0][0].BTCV + available_amounts[0]).toBe(mock.test_balance_btcv)
  })
  
  test('it should make transaction in the amount of 0.00001 BTCV on royale1qy6wrkv3xvfy4jlvwur7nqla7dlyjd8cj83kdn0 address', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'BTCV'}])
    
    const data = mock.getData({
      amount: 0.00001,
      nodes: {
        external: CORE.COINS.BTCV.p2wpkh.externalNode,
        internal: CORE.COINS.BTCV.p2wpkh.internalNode
      }
    })
    
    const BitcoinVault = new BitcoinVaultTx(data)
    const fee_list = await BitcoinVault.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }
    
    const tx = await BitcoinVault.make(tx_data)
    expect(tx).toEqual(mock.test_tx_data)
  })
  
  test('it should not make transaction in the amount of 0.5 BTCV and throw error \'err_tx_btcv_balance: Insufficient balance\'', async () => {
    const data = mock.getData({amount: 0.5})
    
    const BitcoinVault = new BitcoinVaultTx(data)
    const fee_list = await BitcoinVault.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }
    
    try {
      await BitcoinVault.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btcv_balance: Insufficient balance')
    }
  })
  
  test('it should not make transaction because amount is not valid', async () => {
    const data = mock.getData({amount: 'aaa'})
    const BitcoinVault = new BitcoinVaultTx(data)
    const fee_list = await BitcoinVault.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 3 sat pre byte
    }
    
    try {
      await BitcoinVault.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btcv_amount: Invalid amount. Amount must be a Number')
    }
  })
  
  test('it should not make transaction because fee is not valid', async () => {
    const data = mock.getData({amount: 0.00001})
    const BitcoinVault = new BitcoinVaultTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: {}
    }
    
    try {
      await BitcoinVault.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btcv_fee: Invalid fee. Fee must be a Object with \`SAT\` parameter')
    }
  })
  
  test('it should make transaction without a change (send all tx)', async () => {
    const CORE = new Core({
      from: 'mnemonic',
      mnemonic: mock.test_mnemonic
    })
    await CORE.generateWallet()
    await CORE.createCoinsCores([{coin: 'BTCV', type: ''}])
    
    const data = mock.getData({
      amount: 0.00002667,
      nodes: {
        external: CORE.COINS.BTCV.p2wpkh.externalNode,
        internal: CORE.COINS.BTCV.p2wpkh.internalNode
      }
    })
    const BitcoinVault = new BitcoinVaultTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: mock.test_fee
    }
    const tx = await BitcoinVault.make(tx_data)
    expect(tx).toBeDefined()
    expect(tx).toEqual(mock.test_send_all_tx_data)
  })
})
