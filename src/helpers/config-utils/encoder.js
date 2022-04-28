import * as helper from './helpers'

/*
* Encoder to convert currency list to config
* */

const ADDRESS_TYPE_BY_CUR = {
  'ETH': 'P2PKH',
  'ADA': 'ADA'
}

export function encodeConfig(list = []) {
  if (!list || !list.length) return []

  let config_list = []
  let coins_ids = {}

  for (let item of list) {
    let new_item = {
      sort: item.sort,
      group_sort: item.groupSort,
      name: item.walletName || ''
    }

    if (item.category === 'coin') {
      new_item._id = getId(item.shortName, item.addressType, item.account)
    } else {
      const coin = item.family.toUpperCase()
      if (!{}.hasOwnProperty.call(coins_ids, coin)) {
        coins_ids[coin] = getId(coin, ADDRESS_TYPE_BY_CUR[coin], item.account)
      }
      new_item._id = getTokenId(coin, coins_ids[coin], item.contract)
    }

    config_list.push(new_item)
  }

  return config_list
}


export function getId (coin, address_type = 'P2PKH', account = 0) {
  let view = new Uint32Array(5)
  let dp_length, id_dp
  view[0] = helper.BYTE_DATA.VERSION

  coin = coin.toUpperCase()
  address_type = address_type ? address_type.toUpperCase() : null

  view[1] = helper.BYTE_DATA.BLOCKCHAINS[coin] || helper.BYTE_DATA.BLOCKCHAINS.ETH
  switch (coin) {
    case 'BTC':
      view[3] = helper.BYTE_DATA.HD.STANDARD
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('BTC', address_type, account, helper.BYTE_DATA.HD.STANDARD)
      break
    case 'ETH':
      view[3] = helper.BYTE_DATA.HD.NONE
      dp_length = helper.DP.LENGTH.NONE_HD
      id_dp = getDerivationPath('ETH', null, account, helper.BYTE_DATA.HD.NONE)
      break
    case 'BCH':
      view[3] = helper.BYTE_DATA.HD.STANDARD
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('BCH', address_type, account, helper.BYTE_DATA.HD.STANDARD)
      break
    case 'BTCV':
      view[3] = helper.BYTE_DATA.HD.STANDARD
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('BTCV', address_type, account, helper.BYTE_DATA.HD.STANDARD)
      break
    case 'DOGE':
      view[3] = helper.BYTE_DATA.HD.STANDARD
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('DOGE', address_type, account, helper.BYTE_DATA.HD.STANDARD)
      break
    case 'LTC':
      view[1] = helper.BYTE_DATA.BLOCKCHAINS.LTC
      view[3] = helper.BYTE_DATA.HD.STANDARD
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('LTC', address_type, account, helper.BYTE_DATA.HD.STANDARD)
      break
    case 'EOS':
      view[3] = helper.BYTE_DATA.HD.NONE
      dp_length = helper.DP.LENGTH.NONE_HD
      id_dp = getDerivationPath('EOS', null, account, helper.BYTE_DATA.HD.NONE)
      break
    case 'BNB':
      view[3] = helper.BYTE_DATA.HD.NONE
      dp_length = helper.DP.LENGTH.NONE_HD
      id_dp = getDerivationPath('BNB', null, account, helper.BYTE_DATA.HD.NONE)
      break
    case 'EVER':
      view[3] = helper.BYTE_DATA.HD.NONE
      dp_length = helper.DP.LENGTH.NONE_HD
      id_dp = getDerivationPath('EVER', null, account, helper.BYTE_DATA.HD.NONE)
      break
    case 'XDC':
      view[3] = helper.BYTE_DATA.HD.NONE
      dp_length = helper.DP.LENGTH.NONE_HD
      id_dp = getDerivationPath('XDC', null, account, helper.BYTE_DATA.HD.NONE)
      break
    case 'ADA':
      view[3] = helper.BYTE_DATA.HD.ADA
      dp_length = helper.DP.LENGTH.HD
      id_dp = getDerivationPath('ADA', 'ADA', account, helper.BYTE_DATA.HD.ADA)
      break
  }

  view[2] = address_type ? helper.BYTE_DATA.ADDRESS_TYPE[address_type] : helper.BYTE_DATA.ADDRESS_TYPE.P2PKH
  view[4] = helper.BYTE_DATA.IMPORT_FLAG.NONE

  let uniq_import_flag_view = new Uint32Array(1)
  uniq_import_flag_view[0] = helper.BYTE_DATA.UNIQ_IMPORT_FLAG

  let dp_length_view = new Uint32Array(1)
  dp_length_view[0] = dp_length

  const id_main_part = helper.buf2hex(view)
  const id_import_part = helper.buf2hex(uniq_import_flag_view, 8)
  const id_dp_length = helper.buf2hex(dp_length_view)

  return id_main_part + id_import_part + id_dp_length + id_dp
}

export function getTokenId (coin, parent_id, contract) {
  if (!coin || !parent_id || !contract) return false
  coin = coin.toUpperCase()

  let contract_length = contract.length.toString(16)
  let contract_temp = contract.toLowerCase()
  let contract_version

  switch (coin) {
    case 'ETH':
      contract_version = helper.BYTE_DATA.CONTRACT_VERSION.ERC20
      break
    case 'EOS':
      contract_version = helper.BYTE_DATA.CONTRACT_VERSION.EOS
      break
    case 'ADA':
      contract_version = helper.BYTE_DATA.CONTRACT_VERSION.ADA
      break
  }

  contract_version = '0' + contract_version.toString(16)

  const data = helper.toUTF8Array(contract_temp)
  const contract_data = helper.buf2hex(data)

  return parent_id + contract_version + contract_length + contract_data
}

export function getDerivationPath (coin, address_type, account, hd) {
  const PREFIX_M = 0x80
  const PREFIX_COIN = 0x81
  const PREFIX_ACCOUNT = 0x82
  const PREFIX_CHAIN = 0x03
  const PREFIX_ADDRESS = 0x04
  const FULL_DERIVATION = hd === 0x00

  const CHAIN = 0x00
  const ADDRESS = 0x00

  let purpose_in_decimal = helper.DP.PURPOSE.DEFAULT
  let coin_in_decimal
  let account_in_decimal = account || 0

  switch (address_type) {
    case 'P2PKH':
      purpose_in_decimal = helper.DP.PURPOSE.DEFAULT
      break
    case 'P2WPKH':
      purpose_in_decimal = helper.DP.PURPOSE.P2WPKH
      break
    case 'ADA':
      purpose_in_decimal = helper.DP.PURPOSE.ADA
      break

  }
  if (helper.DP.COIN[coin]) {
    coin_in_decimal = helper.DP.COIN[coin]
  } else {
    coin_in_decimal = helper.DP.COIN.DEFAULT
  }

  const PURPOSE = helper.decimalToHex(purpose_in_decimal)
  const COIN = helper.decimalToHex(coin_in_decimal)
  const ACCOUNT = helper.decimalToHex(account_in_decimal)

  let parts = []

  if (FULL_DERIVATION) {
    parts = [[PREFIX_M, PURPOSE], [PREFIX_COIN, COIN], [PREFIX_ACCOUNT, ACCOUNT], [PREFIX_CHAIN, CHAIN], [PREFIX_ADDRESS, ADDRESS]]
  } else {
    parts = [[PREFIX_M, PURPOSE], [PREFIX_COIN, COIN], [PREFIX_ACCOUNT, ACCOUNT]]
  }

  let dp_id = ''

  for (let item of parts) {
    let prefix_view = new Uint32Array(1)
    prefix_view[0] = item[0]

    let part_view = new Uint32Array(1)
    part_view[0] = item[1]

    let prefix = helper.buf2hex(prefix_view)
    let part = helper.buf2hex(part_view, 8)
    part = helper.changeEndianness(part)
    dp_id += prefix + part
  }

  return dp_id
}
