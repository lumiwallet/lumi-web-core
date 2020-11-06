import Core from '@/class/Core'
import {test_core, test_child_nodes} from '@/../__mocks__/coreMock.js'

const test_data = {
  from: 'mnemonic',
  mnemonic: 'magic disorder cable gym napkin gather relief vapor daring main capable armor'
}

const test_derivation_path = 'm/44\'/0\'/0\'/0'

describe('Core class', () => {
  test.only('it should create a Core class by mnemonic', () => {
    const core_exemplar = new Core(test_data)
    
    expect(core_exemplar).toBeDefined()
    expect(core_exemplar).toHaveProperty('xprv', test_core.xprv)
    expect(core_exemplar).toHaveProperty('BTC.address', test_core.BTC.address)
    expect(core_exemplar).toHaveProperty('BCH.address', test_core.BCH.address)
    expect(core_exemplar).toHaveProperty('ETH.address', test_core.ETH.address)
  })
  
  test('it should create a Core class by xprv', () => {
    const core_exemplar = new Core({
      from: 'xprv',
      key: test_core.xprv
    })
    
    expect(core_exemplar).toBeDefined()
    expect(core_exemplar).toHaveProperty('xprv', test_core.xprv)
    expect(core_exemplar).toHaveProperty('BTC.address', test_core.BTC.address)
    expect(core_exemplar).toHaveProperty('BCH.address', test_core.BCH.address)
    expect(core_exemplar).toHaveProperty('ETH.address', test_core.ETH.address)
  })
  
  test('Seed and seedInHex must be a null if core created by xprv key', () => {
    const core_exemplar = new Core({
      from: 'xprv',
      key: test_core.xprv
    })
    
    expect(core_exemplar.DATA.seed).toBeNull()
    expect(core_exemplar.DATA.seedInHex).toBeNull()
  })
  
  test('it should create a Core class if no data.from', () => {
    const core_exemplar = new Core()
    
    expect(core_exemplar).toBeDefined()
  })
  
  test('it should create new cores with 12, 15, 18, 21 and 24 words', () => {
    const core_exemplar_12 = new Core({from: 'new', count: 12})
    const core_exemplar_15 = new Core({from: 'new', count: 15})
    const core_exemplar_18 = new Core({from: 'new', count: 18})
    const core_exemplar_21 = new Core({from: 'new', count: 21})
    const core_exemplar_24 = new Core({from: 'new', count: 24})
    
    expect(core_exemplar_12).toBeDefined()
    expect(core_exemplar_15).toBeDefined()
    expect(core_exemplar_18).toBeDefined()
    expect(core_exemplar_21).toBeDefined()
    expect(core_exemplar_24).toBeDefined()
  })
  
  test('it should return DATA getter with Core info', () => {
    const core_exemplar = new Core(test_data)
    const DATA = core_exemplar.DATA
    
    expect(DATA).toBeDefined()
    expect(DATA).toHaveProperty('mnemonic')
    expect(DATA).toHaveProperty('xprv')
    expect(DATA).toHaveProperty('from')
    expect(DATA).toHaveProperty('hdkey')
    expect(DATA).toHaveProperty('seed')
    expect(DATA).toHaveProperty('seedInHex')
    expect(DATA).toHaveProperty('BTC')
    expect(DATA).toHaveProperty('ETH')
    expect(DATA).toHaveProperty('BCH')
  })
  
  test('it should not create a Core and throw Error with message \'err_core_mnemonic: Wrong mnemonic phrase\'', () => {
    const data = {
      from: 'mnemonic',
      mnemonic: ''
    }
    
    expect(() => {
      const core_exemplar = new Core(data)
    }).toThrow('err_core_mnemonic: Wrong mnemonic phrase. Please, check the spelling and try again')
  })
  
  test('it should not create a Core and throw Error with message \'err_core_xprv: Invalid xprv\'', () => {
    const data = {
      from: 'xprv',
      key: 123
    }
    
    expect(() => {
      const core_exemplar = new Core(data)
    }).toThrow('err_core_xprv: Invalid xprv')
  })
  
  test('it should not create a Core with 11 words and throw Error', () => {
    expect(() => {
      const core_exemplar_11 = new Core({from: 'new', count: 11})
    }).toThrow('Uncaught error')
  })
  
  test('it should not create a Core if mnemonic is invalid', () => {
    expect(() => {
      const core_exemplar = new Core({from: 'mnemonic', mnemonic: 'test test'})
    }).toThrow('err_core_mnemonic: Wrong mnemonic phrase. Please, check the spelling and try again')
  })
  
  test('it should create a child nodes by path "m/44\'/0\'/0\'/0" and range from 0 to 4', () => {
    const core_exemplar = new Core(test_data)
    
    const childNodes = core_exemplar.getChildNodes({
      from: 0,
      to: 4,
      path: test_derivation_path
    })
    
    expect(childNodes).toBeDefined()
    expect(childNodes.list.length).toBe(test_child_nodes.list.length)
  })
  
  test('it should create a child nodes by path "m/44\'/0\'/0\'/0" and range from 0 to 1 and check all fields for equality', () => {
    const core_exemplar = new Core(test_data)
    
    const childNodes = core_exemplar.getChildNodes({
      from: 0,
      to: 0,
      path: test_derivation_path
    })
    
    expect(childNodes).toHaveProperty('node.publicExtendedKey', test_child_nodes.node.publicExtendedKey)
    expect(childNodes.list[0]).toMatchObject(test_child_nodes.list[0])
  })
  
  test('it should not create a child node without path and throw Error with message \`err_core_derivation\`', () => {
    const core_exemplar = new Core(test_data)
    
    expect(() => {
      const childNodes = core_exemplar.getChildNodes({
        from: 0,
        to: 4,
        path: ''
      })
    }).toThrow('err_core_derivation: Problem with derivation. Check node and derivation path')
  })
  
  test('it should not create a child node without FROM value and throw Error with message \'err_core_derivation_range\'', () => {
    const core_exemplar = new Core(test_data)
    
    expect(() => {
      const childNodes = core_exemplar.getChildNodes({
        to: 4,
        path: test_derivation_path
      })
    }).toThrow('err_core_derivation_range: Bad range. Check from/to params')
  })
  
  test('it should not create a child node without TO value and throw Error with message \'err_core_derivation_range\'', () => {
    const core_exemplar = new Core(test_data)
    
    expect(() => {
      const childNodes = core_exemplar.getChildNodes({
        from: 0,
        path: test_derivation_path
      })
    }).toThrow('err_core_derivation_range: Bad range. Check from/to params')
  })
  
  test('it should not create a child node if FROM value more than TO value', () => {
    const core_exemplar = new Core(test_data)
    
    expect(() => {
      const childNodes = core_exemplar.getChildNodes({
        from: 10,
        to: 5,
        path: test_derivation_path
      })
    }).toThrow('err_core_derivation_range: Bad range. Check from/to params')
  })
  
  test('it should not create a child node if data is null', () => {
    const core_exemplar = new Core(test_data)
    
    expect(() => {
      const childNodes = core_exemplar.getChildNodes()
    }).toThrow('err_core_derivation_range: Bad range. Check from/to params')
  })
})
