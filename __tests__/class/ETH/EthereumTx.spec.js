import EthereumTx from '@/class/ETH/EthereumTx'
import * as mock from '@/../__mocks__/ethereumTxMock.js'
import converter from '@/helpers/converters'

describe('EthereumTx class', () => {
  test('it should create a EthereumTx class', () => {
    const data = {}
    
    const Ethereum = new EthereumTx(data)
    
    expect(Ethereum).toBeDefined()
  })
  
  test('it should create fees list with customGasPrice=55000000233 and customGasLimit=25000', async () => {
    const expected = {
      customGasPrice: 55000000233,
      customGasLimit: 25000
    }
    
    const Ethereum = new EthereumTx(mock.test_data)
    const fees = await Ethereum.calcFee(expected.customGasPrice, expected.customGasLimit)
    
    expect(fees[0].gasPrice).toEqual(mock.test_data.gasPrice)
    expect(fees[0].gasLimit).toEqual(21000)
    expect(fees[1].gasPrice).toEqual(expected.customGasPrice)
    expect(fees[1].gasLimit).toEqual(expected.customGasLimit)
  })
  
  test('it should create fees list with defaults customGasPrice and customGasLimit', async () => {
    const Ethereum = new EthereumTx(mock.test_data)
    const fees = await Ethereum.calcFee()
    expect(fees[1].gasPrice).toEqual(0)
    expect(fees[1].gasLimit).toEqual(0)
  })
  
  test('it should not make a transaction without tx data', async () => {
    const Ethereum = new EthereumTx(mock.test_data)
    const tx_data = {}
    
    try {
      await Ethereum.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('Cannot read property \'gasPrice\' of undefined')
    }
  })
  
  test('it should not make a transaction because there is not enough balance', async () => {
    const Ethereum = new EthereumTx(mock.test_data)
    const tx_data = {...mock.test_tx_data, value: 0.53}
    
    try {
      await Ethereum.make(tx_data)
    }
    catch (e) {
      expect(e.message).toEqual('err_tx_eth_balance: Insufficient balance')
    }
  })
  
  test('it should make a transaction with value 0.0052347 ETH', async () => {
    const Ethereum = new EthereumTx(mock.test_data)
    const tx = await Ethereum.make(mock.test_tx_data)
  
    expect(tx).toBeDefined()
    expect(tx).toEqual(mock.test_tx)
  })
  
  test('it should return DATA getter with fee info', async () => {
    const Ethereum = new EthereumTx(mock.test_data)
    const fee = Ethereum.calcFee()
    
    expect(Ethereum.DATA).toBeDefined()
    expect(Ethereum.DATA).toHaveProperty('fee')
  })
})
