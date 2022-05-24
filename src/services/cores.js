import {generateBtcCore} from '@/coins/BTC/core'
import {generateEthCore} from '@/coins/ETH/core'
import {generateBchCore} from '@/coins/BCH/core'
import {generateDogeCore} from '@/coins/DOGE/core'
import {generateLtcCore} from '@/coins/LTC/core'
import {generateXdcCore} from '@/coins/XDC/core'
import {generateBtcvCore} from '@/coins/BTCV/core'
import {generateBnbCore} from '@/coins/BNB/core'

function createCoinsCores(hdkey, coins = []) {
  let core = {}

  for (let item of coins) {
    const {coin, type} = item
    if (!core.hasOwnProperty(coin)) {
      core[coin] = {}
    }

    switch (coin) {
      case 'BTC':
        core[coin][type] = generateBtcCore(hdkey, type)
        break
      case 'ETH':
        core[coin] = generateEthCore(hdkey, type)
        break
      case 'BCH':
        core[coin] = generateBchCore(hdkey)
        break
      case 'DOGE':
        core[coin] = generateDogeCore(hdkey)
        break
      case 'BTCV':
        core[coin] = generateBtcvCore(hdkey)
        break
      case 'XDC':
        core[coin] = generateXdcCore(hdkey)
        break
      case 'LTC':
        core[coin] = generateLtcCore(hdkey)
        break
      case 'BNB':
        core[coin] = generateBnbCore(hdkey)
        break
      case '@G':
        core[coin] = generateEthCore(hdkey)
        break
    }
  }

  return core
}


export {
  createCoinsCores,
  generateBtcCore,
  generateEthCore,
  generateBchCore,
  generateDogeCore,
  generateBtcvCore,
  generateLtcCore,
  generateXdcCore
}
