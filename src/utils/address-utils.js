import addressValidator from 'multicoin-address-validator'

export const getCoinByAddress = (address) => {
  const coins = ['BTC', 'ETH', 'BCH', 'DOGE', 'LTC', 'BNB', 'XDC', 'BTCV', 'EVER', 'ADA']
  let obj = {}

  for (const coin of coins) {
    obj[coin] = checkAddress(address, coin, 'prod')
  }

  return obj
}

export const checkAddress = (address, coin, network = 'prod') => {
  switch (coin) {
    case 'BTCV':
      return isBTCV(address)
    case 'XDC':
      return isXDC(address)
    case 'EVER':
      return isEVER(address)
    default:
      return addressValidator.validate(address, coin, network)
  }
}

function isBTCV(value) {
  if (!value || typeof value !== 'string') return false

  if (value.startsWith('royale') ||
    value.startsWith('Y') ||
    value.startsWith('R')) {
    //34,46
    let reg = new RegExp(/^[a-zA-Z0-9]{30,50}$/gm)
    return reg.test(value)
  } else {
    return false
  }
}

function isBNB(value) {
  if (!value || typeof value !== 'string') return false

  let regexp = new RegExp('^(bnb)([a-z0-9]{39})$') // bnb + 39 a-z0-9
  let match = regexp.exec(value)

  return match !== null
}

function isEVER(value) {
  if (!value || typeof value !== 'string') return false
  let regexp = new RegExp('^(0:)([a-z0-9]{64})$') // 0: + 64 a-z0-9
  let match = regexp.exec(value)
  return match !== null
}

function isXDC(value) {
  let eth = value.replace('xdc', '0x')
  return addressValidator.validate(eth, 'ETH', 'prod')
}
