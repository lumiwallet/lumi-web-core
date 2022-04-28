import * as BtcCore from './BTC/core'
import * as EthCore from './ETH/core'

function createCoinsCores (hdkey, coins = []) {
  console.log('inside createCoinsCores', coins)
  let core = {}

  for (let item of coins) {
    const {coin, type} = item
    if (!core.hasOwnProperty(coin)) {
      core[coin] = {}
    }

    switch (coin) {
      case 'BTC':
        core[coin][type] = BtcCore.generateBtcCore(hdkey, type)
        break
      case 'ETH':
        core[coin][type] = EthCore.generateEthCore(hdkey, type)
        break
      // case 'BCH':
      //   core[coin] = await this._generateBCHcore()
      //   break
      // case 'BTCV':
      //   core[coin] = await this._generateBTCVcore()
      //   break
      // case 'DOGE':
      //   core[coin] = await this._generateDOGEcore()
      //   break
      // case 'LTC':
      //   core[coin] = await this._generateLTCcore()
      //   break
      // case 'BNB':
      //   core[coin] = await this._generateBNBcore()
      //   break
      // case 'XDC':
      //   core[coin] = await this._generateXDCcore()
      //   break
    }
  }

  return core
}


export {
  BtcCore,
  EthCore,
  createCoinsCores
}
