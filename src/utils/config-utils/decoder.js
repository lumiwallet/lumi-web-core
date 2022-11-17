import * as helper from './helpers'

/*
 * Decoder to convert currency list to array of ids
 **/

const NOT_SUPPORTED_COINS = ['EOS']
const COINS_WITH_MEMO = ['BNB', 'EOS', 'EVER']
const NOT_CORE_GENERATION = ['EVER', 'ADA']
const NEED_DEPLOY = ['EVER', '@G']

export function decodeConfig(config) {
  if (!config || !config.length) return {}

  let list = {}
  let list_not_supported_coins = []

  for (let item of config) {
    let currency
    try {
      currency = getCurrency(item._id)
    }
    catch (e) {
      console.log('Decode config error:', e.message)
      if (e.message.includes('Not supported')) {
        list_not_supported_coins.push(item)
      }
      continue
    }

    currency.sort = item.sort

    if (item.name) currency.wallet_name = item.name

    if (!(currency.coin in list)) {
      list[currency.coin] = []
    }
    list[currency.coin].push(currency)
  }

  return {
    list,
    not_supported: list_not_supported_coins
  }
}

export function getCurrency(id) {
  // const VERSION = id.slice(0, 2)
  const BLOCKCHAIN = id.slice(2, 4)
  const ADDRESS_TYPE = id.slice(4, 6)
  const HD = id.slice(6, 8)
  // const IMPORT_FLAG = id.slice(8, 10)
  // const IMPORT_BYTES = id.slice(10, 18)
  const DERIVATION_PATH_LENGTH = parseInt(id.slice(18, 20), 16)
  let offset = 20 + DERIVATION_PATH_LENGTH * 2
  const DERIVATION_PATH = id.slice(20, offset)
  const CURRENCY = getCurrencyByBlockchain(BLOCKCHAIN)

  if (!CURRENCY || !DERIVATION_PATH) {
    throw new Error('Invalid id ' + id)
  }

  if (NOT_SUPPORTED_COINS.includes(CURRENCY)) {
    throw new Error('Not supported currency ' + CURRENCY)
  }
  const item = {
    id: id,
    coin: CURRENCY,
    address_type: getAddressType(ADDRESS_TYPE),
    hd: HD === helper.DATA.HD.STANDARD,
    path: getDerivationPath(DERIVATION_PATH),
    memo: COINS_WITH_MEMO.includes(CURRENCY),
    core: !NOT_CORE_GENERATION.includes(CURRENCY),
    need_deploy: NEED_DEPLOY.includes(CURRENCY)
  }
  item.name = helper.DATA.COIN_NAME[item.coin]

  if (id.length > offset) {
    const COIN_ID = id.slice(0, offset)
    const CONTRACT_VERSION = id.slice(offset, offset + 2)
    offset += 2

    let contract_length = id.slice(offset, offset + 2)
    offset += 2

    contract_length = parseInt(contract_length, 16)
    item.contract_version = helper.DATA.CONTRACT_VERSIONS[CONTRACT_VERSION]

    let decoded_contract = id.slice(offset, offset + contract_length * 2)
    item.contract = getContractByPartId(decoded_contract)
    item.category = 'token'
    item.value = helper.getHash(COIN_ID)
  } else {
    item.category = 'coin'
    item.value = helper.getHash(id)
  }

  return item
}

export function getCurrencyByBlockchain(blockchain) {
  if (blockchain in helper.DATA.BLOCKCHAINS) {
    return helper.DATA.BLOCKCHAINS[blockchain]
  } else {
    throw new Error('getCurrencyByBlockchain: Invalid blockchain ' + blockchain)
  }
}

export function getAddressType(type) {
  if (type in helper.DATA.ADDRESS_TYPES) {
    return helper.DATA.ADDRESS_TYPES[type]
  } else {
    throw new Error('getAddressType: Invalid address type ' + type)
  }
}

export function getDerivationPath(bytes) {
  const slice_length = 10

  if (bytes.length % slice_length !== 0) {
    throw new Error('getDerivationPath: Invalid derivation path ' + bytes)
  }

  const steps = bytes.length / slice_length
  let path = ''

  for (let i = 0; i < steps; i++) {
    const part = bytes.slice(i * slice_length, (i + 1) * slice_length)
    const prefix = part.slice(0, 2)
    const isHardness = prefix[0] === '8'
    let value = part.slice(2)
    value = helper.changeEndianness(value)

    if (i === 0) {
      path += 'm/'
    }
    path += parseInt(value, 16)

    if (isHardness) {
      path += '\''
    }

    if (i + 1 !== steps) path += '/'
  }

  return path
}

function getContractByPartId(decoded_contract) {
  const contract_in_array = decoded_contract.match(/.{1,2}/g)
  return helper.utf8_to_str(contract_in_array).toLowerCase()
}
