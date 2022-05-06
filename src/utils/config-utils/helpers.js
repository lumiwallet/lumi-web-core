export const BYTE_DATA = {
  VERSION: 0x00,
  BLOCKCHAINS: {
    BTC: 0x01,
    ETH: 0x02,
    BCH: 0x03,
    EOS: 0x04,
    DOGE: 0x05,
    BTCV: 0x06,
    BNB: 0x07,
    EVER: 0x08,
    ADA: 0x09,
    LTC: 0x10,
    XDC: 0x11,
    '@G': 0x12
  },
  HD: {
    NONE: 0x00,
    STANDARD: 0x01,
    ADA: 0x02
  },
  IMPORT_FLAG: {
    NONE: 0x00
  },
  ADDRESS_TYPE: {
    NONE: 0x00,
    P2PKH: 0x01,
    P2SH: 0x02,
    P2WPKH: 0x03,
    P2WSH: 0x04
  },
  UNIQ_IMPORT_FLAG: 0x00000000,
  CONTRACT_VERSION: {
    ERC20: 0x01,
    EOS: 0x02,
    ADA: 0x3
  }
}

export const DP = {
  LENGTH: {
    HD: 15,
    NONE_HD: 25
  },
  PURPOSE: {
    DEFAULT: 44,
    P2WPKH: 84,
    ADA: 1852
  },
  COIN: {
    DEFAULT: 0,
    ETH: 60,
    BCH: 145,
    EOS: 194,
    BTCV: 440,
    DOGE: 3,
    BNB: 714,
    EVER: 396,
    LTC: 2,
    XDC: 60,
    ADA: 1815,
    G: 60
  }
}

export const DATA = {
  HD: {
    NONE: '00',
    STANDARD: '01'
  },
  CONTRACT_VERSIONS: {
    '00': 'none',
    '01': 'ERC20',
    '02': 'EOS'
  },
  ADDRESS_TYPES: {
    '00': 'none',
    '01': 'P2PKH',
    '02': 'P2SH',
    '03': 'P2WPKH',
    '04': 'P2WSH'
  },
  BLOCKCHAINS: {
    '00': 'none',
    '01': 'BTC',
    '02': 'ETH',
    '03': 'BCH',
    '04': 'EOS',
    '05': 'DOGE',
    '06': 'BTCV',
    '07': 'BNB',
    '08': 'EVER',
    '09': 'ADA',
    '10': 'LTC',
    '11': 'XDC',
    '12': '@G'
  },
  COIN_NAME: {
    BTC: 'Bitcoin',
    BCH: 'Bitcoin Cash',
    DOGE: 'Dogecoin',
    ETH: 'Ethereum',
    EOS: 'EOS',
    BTCV: 'Bitcoin Vault',
    BNB: 'Binance Coin',
    EVER: 'Crystal',
    LTC: 'Litecoin',
    XDC: 'XinFin Network',
    ADA: 'Cardano',
    '@G': 'Graphite'
  }
}

export function utf8_to_str(src, off, lim) {
  lim = lim == null ? src.length : lim
  for (var i = off || 0, s = ''; i < lim; i++) {
    var h = src[i].toString(16)
    if (h.length < 2) h = '0' + h
    s += '%' + h
  }
  return decodeURIComponent(s)
}

export function changeEndianness(string) {
  const result = []
  let len = string.length - 2
  while (len >= 0) {
    result.push(string.substr(len, 2))
    len -= 2
  }
  return result.join('')
}

export function getHash(input) {
  let hash = 0, len = input.length
  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash |= 0 // to 32bit integer
  }
  return Math.abs(hash)
}

export function buf2hex(buffer, length = 2) { // buffer is an ArrayBuffer
  const prefix = Array(length).fill('0').join('')
  return Array.prototype.map.call(new Uint16Array(buffer), x => (prefix + x.toString(16)).slice(-1 * length)).join('')
}

export function decimalToHex(d) {
  return '0x' + Number(d).toString(16).padStart(2, '0')
}

export function toUTF8Array(str) {
  let utf8 = []
  for (var i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i)
    if (charcode < 0x80) utf8.push(charcode)
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6),
        0x80 | (charcode & 0x3f))
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f))
    }
    // surrogate pair
    else {
      i++
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10)
        | (str.charCodeAt(i) & 0x3ff))
      utf8.push(0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f))
    }
  }
  return utf8
}
