import * as BtcCore from './BTC/core'

function createCoinsCores (hdkey, coins = []) {
  console.log('start createCoinsCores', hdkey, coins)
  let core = {}

  for (let item of coins) {
    const {coin, type} = item
    if (!core.hasOwnProperty(coin)) {
      core[coin] = {}
    }
    console.log(coin, type)
    switch (coin) {
      case 'BTC':
        core[coin][type] = BtcCore.generateBtcCore(hdkey, type)
        break
      // case 'ETH':
      //   core[coin][type] = await this._generateETHcore(type)
      //   break
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
  createCoinsCores
}
