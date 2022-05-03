import {generateBtcCore} from './BTC/core'
import {generateEthCore} from './ETH/core'
import {generateBchCore} from './BCH/core'
import {generateDogeCore} from './DOGE/core'
import {generateXdcCore} from './XDC/core'

function createCoinsCores(hdkey, coins = []) {
  console.log('inside createCoinsCores', coins)
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
        core[coin][type] = generateEthCore(hdkey, type)
        break
      case 'BCH':
        core[coin] = generateBchCore(hdkey)
        break
      case 'DOGE':
        core[coin] = generateDogeCore(hdkey)
        break
      // case 'BTCV':
      //   core[coin] = await this._generateBTCVcore()
      //   break
      // case 'LTC':
      //   core[coin] = await this._generateLTCcore()
      //   break
      // case 'BNB':
      //   core[coin] = await this._generateBNBcore()
      //   break
      case 'XDC':
        core[coin] = generateXdcCore(hdkey)
        break
    }
  }

  return core
}


export {
  generateBtcCore,
  generateEthCore,
  generateBchCore,
  generateDogeCore,
  createCoinsCores
}
