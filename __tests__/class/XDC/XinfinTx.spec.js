import XinfinTx from '@/class/XDC/XinfinTx'
import * as mock from '@/../__mocks__/xinfinTxMock.js'

describe('XinfinTx class', () => {
  test('it should create a XinfinTx class', () => {
    const data = {}
    const tx = new XinfinTx(data)
    expect(tx).toBeDefined()
  })

  test('it should create fees list', async () => {
    const tx = new XinfinTx(mock.test_data)
    const fees = await tx.calcFee()
    expect(fees[0].gasPrice).toEqual(mock.test_fee.gasPrice)
    expect(fees[0].gasLimit).toEqual(mock.test_fee.gasLimit)
    expect(fees[0].fee).toEqual(mock.test_fee.fee)
  })

  test('it should not make a transaction without tx data', async () => {
    const tx = new XinfinTx(mock.test_data)
    const tx_data = {}

    try {
      await tx.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_eth_invalid_params: Invalid params. Nonce, value, gas price and gas limit have to be a number')
    }
  })

  test('it should not make a transaction because there is not enough balance', async () => {
    const tx = new XinfinTx(mock.test_data)
    const tx_data = {...mock.test_tx_data, value: 11}

    try {
      await tx.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_xdc_balance: Insufficient balance')
    }
  })

  test('it should make a transaction with value 9 XDC', async () => {
    const tx = new XinfinTx(mock.test_data)
    const rawTw = await tx.make(mock.test_tx_data)

    expect(tx).toBeDefined()
    expect(rawTw).toEqual(mock.test_tx)
  })
})
