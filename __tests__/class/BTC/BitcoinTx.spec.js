import BitcoinTx from '@/class/BTC/BitcoinTx'
import {calcBtcTxSize} from '@/helpers/coreHelper'
import * as mock from '@/../__mocks__/bitcoinTxMock'
import * as segwitMock from '@/../__mocks__/p2wpkhTxMock'

describe('BitcoinTx class', () => {
  test('it should create a BitcoinTx class', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 0,
      customFee: 0
    }
    
    let Bitcoin = new BitcoinTx(data)
    
    expect(Bitcoin).toBeDefined()
  })
  
  test('it should create a BitcoinTx class with amount=1.1 and customFee=15', () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: [],
      amount: 1.1,
      customFee: '15'
    }
    
    const expected_amount = 110000000
    const expected_custom_fee = 15
    
    const Bitcoin = new BitcoinTx(data)
    
    expect(Bitcoin).toBeDefined()
    expect(Bitcoin.amount).toBe(expected_amount)
    expect(Bitcoin.customFee).toBe(expected_custom_fee)
  })
  
  test('it should create empty fees list', async () => {
    const data = {
      unspent: [],
      balance: 0,
      feeList: mock.test_fees,
      amount: 1.1,
      customFee: '15'
    }
    
    const Bitcoin = new BitcoinTx(data)
    const fees = await Bitcoin.calcFee()
    
    expect(fees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          BTC: 0
        })
      ])
    )
  })
  
  test('it should calculate fees list for amount 0.00005 BTC', async () => {
    const data = {
      unspent: mock.test_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.00005,
      customFee: '15'
    }
    
    const Bitcoin = new BitcoinTx(data)
    const fees = await Bitcoin.calcFee()
    
    expect(fees[0].BTC).toBe(0) // for 99 sat pre byte
    expect(fees[1].BTC).toBe(0.00000904) // for 4 sat pre byte
    expect(fees[2].BTC).toBe(0.00000452) // for 2 sat pre byte
    expect(fees[3].BTC).toBe(0.0000339) // for 15 sat pre byte
  })
  
  test('it should calculate fees list for all available amount', async () => {
    const tx_size = calcBtcTxSize(mock.test_unspent.length, 1)
    const available_amounts = mock.test_fees.map(item => { //  [ -0.00020117, 0.00026243, 0.00027219 ]
      return (mock.test_balance - item.feePerByte * tx_size) / Math.pow(10, 8)
    })
    
    const data = available_amounts.map(amount => {
      return mock.getData({amount})
    })
    const fees = []
    
    for (let btc_data of data) {
      const Bitcoin = new BitcoinTx(btc_data)
      const fee = await Bitcoin.calcFee(488)
      
      fees.push(fee)
    }
    
    expect(fees[0][0].BTC).toBe(0) // for 99 sat pre byte
    expect(fees[1][1].BTC + available_amounts[1]).toBe(mock.test_balance_btc) // for 4 sat pre byte
    expect(fees[2][2].BTC + available_amounts[2]).toBe(mock.test_balance_btc) // for 2 sat pre byte
  })
  
  test('it should make P2PKH transaction in the amount of 0.00001 BTC on 15xQAQWzpSf8Qjq4UvvtpSXk88KnCGixEa address', async () => {
    const data = mock.getData({amount: 0.00001})
    
    const Bitcoin = new BitcoinTx(data)
    const fee_list = await Bitcoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[2] // 2 sat pre byte
    }
    const tx = await Bitcoin.make(tx_data)
    expect(tx).toEqual(mock.test_tx_data)
  })
  
  test('it should make P2WPKH transaction in the amount of 0.00001 BTC on bc1qnphkxa7x4gp7fgl495n4hr2np02svyc7kz6scn address', async () => {
    const data = segwitMock.getData({amount: 0.00003})
    
    const Bitcoin = new BitcoinTx(data)
    const fee_list = await Bitcoin.calcFee()
    const tx_data = {
      addressTo: segwitMock.recipient_address,
      fee: fee_list[1] // 4 sat pre byte
    }
    const tx = await Bitcoin.make(tx_data)
    expect(tx).toEqual(segwitMock.test_tx_data)
  })
  
  test('it should not make transaction in the amount of 0.5 BTC and throw error \'err_tx_btc_balance: Insufficient balance\'', async () => {
    const data = mock.getData({amount: 0.5})
    
    const Bitcoin = new BitcoinTx(data)
    const fee_list = await Bitcoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[2] // 2 sat pre byte
    }
    
    try {
      await Bitcoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btc_balance: Insufficient balance')
    }
  })
  
  test('it should not make transaction because amount is not valid', async () => {
    const data = mock.getData({amount: 'aaa'})
    const Bitcoin = new BitcoinTx(data)
    const fee_list = await Bitcoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fee_list[0] // 2 sat pre byte
    }
    
    try {
      await Bitcoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btc_amount: Invalid amount. Amount must be a Number')
    }
  })
  
  test('it should not make transaction because fee is not valid', async () => {
    const data = mock.getData({amount: 0.00001})
    const Bitcoin = new BitcoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: {}
    }
    
    try {
      await Bitcoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btc_fee: Invalid fee. Fee must be a Object with `SAT` parameter')
    }
  })
  
  test('it should not make transaction because unspent is not valid', async () => {
    const data = {
      unspent: mock.invalid_unspent,
      balance: mock.test_balance,
      feeList: mock.test_fees,
      amount: 0.00001,
      customFee: 0
    }
    
    const Bitcoin = new BitcoinTx(data)
    const fees = await Bitcoin.calcFee()
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: fees[1]
    }
    
    try {
      await Bitcoin.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_btc_unspent: Invalid unspent. Try to resync the BTC wallet')
    }
  })
  
  test('it should make transaction without a change (send all tx)', async () => {
    const data = mock.getData({amount: 0.00026243})
    const Bitcoin = new BitcoinTx(data)
    const tx_data = {
      addressTo: mock.recipient_address,
      fee: mock.test_fee
    }
    
    const tx = await Bitcoin.make(tx_data)
    
    expect(tx).toBeDefined()
  })
})
