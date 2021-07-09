import Core from '@/class/Core'
import {test_core, test_child_nodes, test_data, test_derivation_path} from '@/../__mocks__/coreMock.js'

describe('Core class', () => {
  test('it should create a Core class by mnemonic', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    expect(core_exemplar).toBeDefined()
    expect(core_exemplar).toHaveProperty('xprv', test_core.xprv)
  })

  test('it should create a Core class by mnemonic with coins cores', async () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    const coins = [
      {coin: 'BTC', type: 'p2pkh'},
      {coin: 'BTC', type: 'p2wpkh'},
      {coin: 'ETH', type: 0},
      {coin: 'BCH'},
      {coin: 'BTCV'},
      {coin: 'DOGE'},
      {coin: 'LTC'},
      {coin: 'BNB'}
    ]
    await core_exemplar.createCoinsCores(coins)

    expect(core_exemplar).toBeDefined()
    expect(core_exemplar).toHaveProperty('xprv', test_core.xprv)
    expect(core_exemplar).toHaveProperty('COINS.BTC.p2pkh.externalAddress', test_core.BTC.p2pkh.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.BTC.p2wpkh.externalAddress', test_core.BTC.p2wpkh.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.BCH.p2pkh.externalAddress', test_core.BCH.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.BTCV.p2wpkh.externalAddress', test_core.BTCV.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.ETH.0.externalAddress', test_core.ETH.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.DOGE.p2pkh.externalAddress', test_core.DOGE.p2pkh.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.LTC.p2wpkh.externalAddress', test_core.LTC.p2wpkh.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.BNB.p2pkh.externalAddress', test_core.BNB.p2pkh.externalAddress)
  })

  test('it should create a Core class by xprv', async () => {
    const core_exemplar = new Core({
      from: 'xprv',
      key: test_core.xprv
    })
    core_exemplar.generateWallet()
    const coins = [
      {coin: 'BTC', type: 'p2pkh'},
      {coin: 'ETH', type: 0}
    ]
    await core_exemplar.createCoinsCores(coins)

    expect(core_exemplar).toBeDefined()
    expect(core_exemplar).toHaveProperty('xprv', test_core.xprv)
    expect(core_exemplar).toHaveProperty('COINS.BTC.p2pkh.externalAddress', test_core.BTC.p2pkh.externalAddress)
    expect(core_exemplar).toHaveProperty('COINS.ETH.0.externalAddress', test_core.ETH.externalAddress)
  })

  test('Seed and seedInHex must be a null if core created by xprv key', () => {
    const core_exemplar = new Core({
      from: 'xprv',
      key: test_core.xprv
    })
    core_exemplar.generateWallet()

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
    core_exemplar.generateWallet()
    const DATA = core_exemplar.DATA

    expect(DATA).toBeDefined()
    expect(DATA).toHaveProperty('mnemonic')
    expect(DATA).toHaveProperty('xprv')
    expect(DATA).toHaveProperty('from')
    expect(DATA).toHaveProperty('hdkey')
    expect(DATA).toHaveProperty('seed')
    expect(DATA).toHaveProperty('seedInHex')
  })

  test('it should not create a Core and throw Error with message \'err_core_mnemonic: Wrong mnemonic phrase\'', async () => {
    const data = {
      from: 'mnemonic',
      mnemonic: ''
    }
    const core_exemplar = new Core(data)

    try {
      await core_exemplar.generateWallet()
    }
    catch (e) {
      expect(e.message).toEqual('err_core_mnemonic: Wrong mnemonic phrase. Please, check the spelling and try again')
    }
  })

  test('it should not create a Core and throw Error with message \'err_core_xprv: Invalid xprv\'', async () => {
    const data = {
      from: 'xprv',
      key: 123
    }
    const core_exemplar = new Core(data)

    try {
      await core_exemplar.generateWallet()
    }
    catch (e) {
      expect(e.message).toEqual('err_core_xprv: Invalid xprv')
    }
  })

  test('it should not create a Core with 11 words and throw Error', async () => {
    const core_exemplar = new Core({from: 'new', count: 11})

    try {
      await core_exemplar.generateWallet()
    }
    catch (e) {
      expect(e.message).toEqual('err_core_entropy: Bad entropy')
    }
  })

  test('it should not create a Core if mnemonic is invalid', async () => {
    const core_exemplar = new Core({from: 'mnemonic', mnemonic: 'test test'})

    try {
      await core_exemplar.generateWallet()
    }
    catch (e) {
      expect(e.message).toEqual('err_core_mnemonic: Wrong mnemonic phrase. Please, check the spelling and try again')
    }
  })

  test('it should create a child nodes by path "m/44\'/0\'/0\'/0" and range from 0 to 4', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    const childNodes = core_exemplar.getChildNodes({
      from: 0,
      to: 4,
      path: test_derivation_path,
      coins: []
    })

    expect(childNodes).toBeDefined()
    expect(childNodes.list.length).toBe(test_child_nodes.list.length)
  })

  test('it should create a child nodes by path "m/44\'/0\'/0\'/0" and range from 0 to 2 and check all fields for equality', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    const childNodes = core_exemplar.getChildNodes({
      from: 0,
      to: 4,
      path: test_derivation_path,
      coins: [
        {
          coin: 'BTC',
          type: 'p2pkh'
        },
        {
          coin: 'ETH',
          type: 0
        },
        {
          coin: 'BCH'
        },
        {
          coin: 'BTCV'
        },
        {
          coin: 'DOGE'
        },
        {
          coin: 'LTC'
        },
        {
          coin: 'BNB'
        }
      ]
    })

    expect(childNodes).toHaveProperty('node.publicExtendedKey', test_child_nodes.node.publicExtendedKey)
    expect(childNodes.list[0]).toMatchObject(test_child_nodes.list[0])
    expect(childNodes.list[1]).toMatchObject(test_child_nodes.list[1])
    expect(childNodes.list[2]).toMatchObject(test_child_nodes.list[2])
    expect(childNodes.list[3]).toMatchObject(test_child_nodes.list[3])
    expect(childNodes.list[4]).toMatchObject(test_child_nodes.list[4])
  })

  test('it should not create a child node without path and throw Error with message \`err_core_derivation\`', async () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    try {
      const childNodes = await core_exemplar.getChildNodes({
        from: 0,
        to: 4,
        path: '',
        coins: []
      })
    }
    catch (e) {
      expect(e.message).toEqual('err_core_derivation: Problem with derivation. Check node and derivation path')
    }
  })

  test('it should not create a child node without FROM value and throw Error with message \'err_core_derivation_range\'', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    try {
      const childNodes = core_exemplar.getChildNodes({
        to: 4,
        path: test_derivation_path
      })
    }
    catch (e) {
      expect(e.message).toEqual('err_core_derivation_range: Bad range. Check from/to params')
    }
  })

  test('it should not create a child node without TO value and throw Error with message \'err_core_derivation_range\'', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    try {
      const childNodes = core_exemplar.getChildNodes({
        from: 0,
        path: test_derivation_path
      })
    }
    catch (e) {
      expect(e.message).toEqual('err_core_derivation_range: Bad range. Check from/to params')
    }
  })

  test('it should not create a child node if FROM value more than TO value', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    try {
      const childNodes = core_exemplar.getChildNodes({
        from: 10,
        to: 5,
        path: test_derivation_path
      })
    }
    catch (e) {
      expect(e.message).toEqual('err_core_derivation_range: Bad range. Check from/to params')
    }
  })

  test('it should not create a child node if data is null', () => {
    const core_exemplar = new Core(test_data)
    core_exemplar.generateWallet()

    try {
      const childNodes = core_exemplar.getChildNodes()
    }
    catch (e) {
      expect(e.message).toEqual('err_core_derivation_range: Bad range. Check from/to params')
    }
  })
})
