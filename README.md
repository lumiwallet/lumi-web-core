[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://mit-license.org)
[![NPM](https://img.shields.io/npm/v/lumi-web-core.svg)](https://www.npmjs.org/package/lumi-web-core)

![lumicore](https://user-images.githubusercontent.com/63342220/80406279-7c663380-88cc-11ea-8b06-07825767b288.png)

# LumiCore
The LumiCore library is an implementation of tools for working with Bitcoin, Ethereum, Bitcoin Cash, Bitcoin Vault, Dogecoin, Litecoin, Binance and Xinfin Network. It allows to create and work with mnemonic following the BIP39 standard, to run the private/public keys derivation tree following the BIP44 standard and sign transactions.

> Work of this module has been tested in applications at the Vue.js. You can find it [here](https://github.com/lumiwallet/lumi-web-core-app).

**Note**: Node version >= 10.19.0

## Installation
You can install the package via npm
``` console
npm install lumi-web-core
```
Or via yarn:
``` console
yarn add lumi-web-core
```

## Usage

> **Warning!** Do not use the mnemonic, keys, and addresses provided in this readme for real transactions!
>
### Create/import
Import the module and create a new class:
``` js
// typical import
import Wallet from 'lumi-web-core'

const WALLET = new Wallet()
```
You can create a new wallet by calling the method `createNew(count)`. Count is the number of words for the new mnemonic.
By default it is 12. It can be also  12, 15, 18, 21, and 24 words.
``` js
// Create a new wallet
const CORE = await WALLET.createNew(15)
```
You can create a wallet based on an existing mnemonic, where mnemonic is a string consisting of words and spaces:
``` js
// Create wallet by new mnemonic
const CORE = await WALLET.createByMnemonic('ramp grief anger ... olive main into throw')
```
Or xprv key: 
``` js
// Create wallet by xprv key
const CORE = await WALLET.createByKey('xprv9s21ZrQH143K49Xa838YbhNq...VtL5sLB9JsijRG51jHjuUSDVfDXPh5PFYNTqQ')
```
Example of the returned core:
``` js
{
    mnemonic: "ramp grief anger ... olive main into throw",
    xprv: "xprv9s21ZrQH143K49Xa838YbhNq...VtL5sLB9JsijRG51jHjuUSDVfDXPh5PFYNTqQ",
    from: "mnemonic",
    hdkey: Object,
    seed: Uint8Array(64),
    seedInHex: "1f53c65842ed3d0c54052f7f7315dbd9dcb...4af426ffb27234a0a571c44e29c1f4d1b181082e62d0a39"
}
```
After that, call the `createCoinsCores()` method to create cores for specific currencies.
``` js
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
const CORES = await WALLET.createCoins(coins)
=> {
    BTC: {
        p2pkh: {
            externalNode: Object,
            internalNode: Object,
            externalAddress: "1PtMtCbtgb...bivNJU5Ww3bvF3",
            internalAddress: "1LvXQnwCeq...GyfMNtxpyEd3Hx",
            dp: {external: "m/44'/0'/0'/0", internal: "m/44'/0'/0'/1"}
        },
        p2wpkh: {
            externalNode: Object,
            internalNode: Object,
            externalAddress: "bc1qyluu9yjfw6...xjfjy0ht8hszx",
            internalAddress: "bc1qnk6r09q97m...w9vme4zjvpct0",
            dp: {external: "m/84'/0'/0'/0", internal: "m/84'/0'/0'/1"}
        }
    },
    ETH: {
        0: {
            dp: "m/44'/60'/0'/0/0",
            externalAddress: "0xcf06fa556d8ad...cc285e2b7bdf58c58",
            node: Object,
            privateKey: Buffer,
            privateKeyHex: "0xb1f8f5df78d5a00d...6b222e54ee8abbfe6af",
            publicKey: Buffer,
        }
    },
    BTCV: {
        p2wpkh: {
            dp: {external: "m/84'/440'/0'/0", internal: "m/84'/440'/0'/1"},
            externalAddress: "royale1q2cy79nu...am6t5svnvt9d62",
            externalNode: Object,
            internalAddress: "royale1qe9286wc4...tlqxj9sz0t7m9dg5q",
            internalNode: Object
        }
    },
    BCH: {
        p2pkh: {
            dp: {external: "m/44'/145'/0'/0", internal: "m/44'/145'/0'/1"},
            externalAddress: "1Nbi1Roep9...SeJKwQTdFESB",
            externalNode: Object,
            internalAddress: "1135Eji7Yoop...rKJmGFi2RyX",
            internalNode: Object
        }
    },
    DOGE: {
        p2pkh: {
            dp: {external: "m/44'/3'/0'/0", internal: "m/44'/3'/0'/1"},
            externalAddress: "DLXryK9F7k...BMrcqFMci",
            externalNode: Object,
            internalAddress: "DKqyuCkSYJXt...PxnYcUxM'",
            internalNode: Object
        }
    },
    LTC: {
        p2wpkh: {
            dp: {external: "m/84'/2'/0'/0", internal: "m/84'/2'/0'/1"},
            externalAddress: "ltc1q35...tdk8nme",
            externalNode: Object,
            internalAddress: "ltc1qcjs2w...jh06jac",
            internalNode: Object
        }
    },
    BNB: {
      p2pkh: {
        node: Object,
        privateKey: Buffer,
        privateKeyHex: '036852f55d1b759...2de02c72a47fea1c592',
        publicKey: Buffer,
        publicKeyHex: '03ec67b0636efb9e543e..4d7b458e52d9dd301da99',
        externalAddress: 'bnb1kd4kt7x505l...9qlxp7x365ld8fkt',
        dp: 'm/44\'/714\'/0\'/0/0'
      }
    }
```
For BTC and ETH coins, the type parameter is required.
For BTC, it can take the values p2pkh or p2wpkh (p2pkh by default).
For ETH, the type parameter is set to the account number (0 by default).

### Derivation
You can get information about a child node using the method `getChildNodes`.
``` js
const data = {
    path: "m/44'/0'/0'/0",
    from: 0,
    to: 20,
    coins: [
        {coin: 'BTC', type: 'p2pkh'},
        {coin: 'BTC', type: 'p2wpkh'},
        {coin: 'ETH', type: 0},
        {coin: 'BCH'},
        {coin: 'BTCV'},
        {coin: 'DOGE'},
        {coin: 'LTC'}
        {coin: 'BNB'}
    ]
}

const info = await WALLET.getChildNodes(data)
=> {
    node: {
        privateExtendedKey: "xprvA1CHKT9koKiKuhkeZ6XJxWXEQ1r...va4RtZfFmdYaQeNW72vX9q2DjMo3fsJwxCtkrVXyo2QP8",
        publicExtendedKey: "xpub6EBdixgedhGd8Bq7f84KKeTxx3gYWQ...bn9YVZ8PVXb6tTnCWTorLQPKqRggvdzyHH1TkoR7vuz"
    },
    list: [
        {
            path: "m/44'/0'/0'/0/0",
            privateKey: "KzwMNQ93Dt96Qg...mRpaBCmEXGH2Lpgr2dGZsV",
            publicKey: "023b693fa7fa22e505...4cc450a463c024ab1e3ec526ba",
            bchAddress: "bitcoincash:qqtne...l889v5ee6nawwvvx6t7mvkp",
            btcvAddress: "royale1qzu70e44r...8eeet9xww5ltnnr6akytm",
            ethAddress: "0xdd6f3cc0ed5f9...b09481090536e446ebd3",
            p2pkhAddress: "137sbugaaqw3H...LZzNX3nTk1LDgCYd",
            p2wpkhAddress: "bc1qzu70e44r...eet9xww5ltnnrm5mjxk",
            dogeAddress: 'DS58JVRHdU...zuBNNVLFo4UaTn',
            ltcAddress: 'ltc1...07g',
            bnbAddress: 'bnb1hvw4qlty...7xm9g3fdsrcqzzkh'
        },
        ...
    ]
}
```
`path` this is a string with a derivation path. The path should begin with `m/44'`.
`from` is top of the range derivation
`to` is end of the range derivation
`coins` is a list of currencies for which you need to generate addresses

* [BCH transaction](./src/class/BCH/README.md)
* [BNB transaction](./src/class/BNB/README.md)
* [BTC transaction](./src/class/BTC/README.md)
* [BTCV transaction](./src/class/BTCV/README.md)
* [DOGE transaction](./src/class/DOGE/README.md)
* [ETH transaction](./src/class/ETH/README.md)
* [LTC transaction](./src/class/LTC/README.md)
* [XDC transaction](./src/class/XDC/README.md)


## Nist testing
Testing [documentation](./nist/README.md).

## Created using
* [bip39](https://github.com/bitcoinjs/bip39)
* [bip39-checker](https://github.com/jcalfee/bip39-checker)
* [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
* [@ethereumjs/tx](https://github.com/ethereumjs/ethereumjs-monorepo/tree/master/packages/tx)
* [ethereumjs-util](https://github.com/ethereumjs/ethereumjs-util)
* [hdkey](https://github.com/cryptocoinjs/hdkey)
* [wif](https://github.com/bitcoinjs/wif)
* [worker-loader](https://github.com/webpack-contrib/worker-loader)
* [bitcore-lib-cash](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-lib-cash)
* [bchaddrjs](https://github.com/ealmansi/bchaddrjs)
## License

LumiCore is available under the MIT license. See the [LICENSE](LICENSE) file for more info.
