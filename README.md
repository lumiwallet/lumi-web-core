[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://mit-license.org)
[![NPM](https://img.shields.io/npm/v/lumi-web-core.svg)](https://www.npmjs.org/package/lumi-web-core)

![lumicore](https://user-images.githubusercontent.com/63342220/80406279-7c663380-88cc-11ea-8b06-07825767b288.png)

# LumiCore
The LumiCore library is an implementation of tools for working with Bitcoin, Ethereum, Bitcoin Cash, Bitcoin Vault, Dogecoin and Binance. It allows to create and work with mnemonic following the BIP39 standard, to run the private/public keys derivation tree following the BIP44 standard and sign transactions.

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

### Creating a BTC transaction
Creation of P2PKH or P2WPKH transactions is supported.
To create a Bitcoin transaction you need to send a set of inputs and outputs to the `makeRawBtcTx` method:
``` js
const data = {
    inputs: [
        {
            address: "1BYRALP...ypWzTQE8BkEL",
            value: 10000,
            tx_output_n: 0,
            tx: '01000000014b172c2...0983ce0e044d91cea88ac00000000', // Raw transaction (only for P2PKH transactions)
            tx_hash_big_endian: "de06df091735...afd145eecfcd5649634e1d5221",
            key: 'L3YFJ4cBDYhZ...bzqgSUxLjTAorR5Kc47mP6x1D'
        },
        {
            address: "1BYRALPU...kLypWzTQE8BkEL",
            value: 10000,
            tx_output_n: 0,
            tx: '01000000014b172c2...0983ce0e044d91cea88ac00000000', // Raw transaction (only for P2PKH transactions)
            tx_hash_big_endian: "47e497fd8f6f4...5c2043e0a3c7ee0463cbc68e9",
            key: 'L3YFJ4cBDYhZ...xLjTAorR5Kc4AorR5K7mP6x1D'
        }
    ],
    outputs: [
        {
            address: '1NuABwx...5V5tiXpshAWb8W',
            value: 15000
        },
        {
            address: '1PbQ36GvG...nimPD7gHPQFk3Nu',
            value: 5000
        }
    ]
}

const btc_tx = await WALLET.makeRawBtcTx(data)
```
When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
btc_tx => {
    hash: '6b4a00f9fd4e5c263b5af65fed0...14cafb97e0f5738cb4a8717',
    tx: '010000000221521d4e634956cdcfee45d1afbe79080a...04f3d76f2c65501976a914fbf7f38b23308227a308fffff88ac00000000'
}
```

### Creating an ETH transaction
To make a Ethereum transaction you need to fill in the following params:
``` js
const data = {
    nonce: 280,
    amount: 100000000000000,
    address: '0x1e8d99d2278...d89983e2920df33b485',
    gasPrice: 19950000002,
    gasLimit: 21000,
    privateKey: '0xd27c8544f946bd2a5456...d174e64e4a03030917bb8313'
}

const eth_tx = await WALLET.makeRawEthTx(data)
```

When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
eth_tx => {
    hash: '0xcb3869c19f2462a572a5ff13...d67ca71c181452e52a698d035209',
    tx: '0xf86c8201188504a51cd782825208...6df4207768a01789b726296195a956ceb3dbe73798'
}
```

### Creating a BCH transaction
To create a Bitcoin Cash transaction you need to send a set of inputs and outputs to the `makeRawBchTx` method:
``` js
const data = {
    inputs: [
        {
            address: "bitcoincash:qzq29...rfavhxrhwvgm49vlhq",
            outputIndex: 1,
            satoshis: 604909,
            script: "76a91480a2a2...81a7acb98777388ac",
            txId: "0488b0c6678e527...5307ce7ddaa8cbc986e616",
            key: "KxMvzeEuGyrBRo...mfR9uzU6bAuc6kyXTmN8h"
        }
    ],
    outputs: [
        {
            address: "bitcoincash:qzdss...rfpnawutm9vlrh7wdcj",
            satoshis: 100000
        },
        {
            address: "bitcoincash:qr30f7...23hykq2fu3axuxec3g6c6",
            satoshis: 504231
        }
    ]
}

const bch_tx = await WALLET.makeRawBchTx(data)
```
Addresses included in inputs and outputs can be CashAddr format or Legacy format.
When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
bch_tx => {
    hash: 'ac5cd881770c28aad990...5d181df4b7d5a9acfec3bdf',
    tx: '020000000116e686c9cba8da7dce075...edac9eff87677eccaa372580a4f23d3788ac00000000'
}
```

For more information, see the [docs](https://lumiwallet.github.io/lumi-web-core/).

### Creating a BTCV transaction
To create a Bitcoin Vault transaction you need to send a set of inputs and outputs to the `makeRawBtcvTx` method:
``` js
const data = {
    inputs: [
        {
            hash: '6e87ad9bf88f7ad02bb4...65bdc31547de6c7293348',
            index: 0,
            value: 3000,
            key: 'L4Whg5XDChoMm6YqfE...eDFmWwUJCxcuZ8Zk7edGUA' 
        }
    ],
    outputs: [
        {
            address: 'royale1qy6wrkv3...7nqla7dlyjd8cj83kdn0',
            value: 1000
        },
        {
            address: 'royale1q8lvf3v...j9vlu3py02klanwmzshvk',
            value: 1571
        }
    ]
}

const btcv_tx = await WALLET.makeRawBtcvTx(data)
```
When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
btcv_tx => {
    hash: '98f5f94267101de83364...b4a9c74a26a05b90d4381f9479710',
    tx: '01000000000101483329c7e67d5431dc5...c6d8daeeb40e248438119513fb455d38100000000'
}
```

### Creating a DOGE transaction
To create a Dogecoin transaction you need to send a set of inputs and outputs to the `makeRawDogeTx` method:
``` js
const data = {
    inputs: [
        {
            hash: '49a8205185d60d66273b...d9c9d63d8e359b0c3c93a21',
            index: 0,
            address: 'DA7wKChj5Zi...Z84VwfS1BqcPczk',
            value: 100000000,
            key: 'L2Zr1gYfWUWahL...28a2AQkxGD9KhNtrb',
            tx: '0100000002789f2641b132b219f...3a65a75888226819f66c4d4b7debc9'
        }
    ],
    outputs: [
        {
            address: 'DGzBtLKz99r...tEEw5kQio',
            value: 35600000
        },
        {
            address: 'DQ52GryK3ni...ZjpnKHH8UY',
            value: 64400000
        }
    ]
}

const doge_tx = await WALLET.makeRawDogeTx(data)
```
When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
doge_tx => {
    hash: '0e2578db7490a13855696...e3b2e689b89c63a55634b1a58',
    tx: '0100000002213ac9c3b059e3d863...88c983930f02d9f636f5e354088ac00000000'
}
```

### Creating a BNB transaction
To create a Binance transaction you need to create a new class `BinanceTx` and call method `make`:
``` js
import BinanceTx from 'lumi-web-core'

const params = {
  account_number: 4065011,
  address: 'bnb18lv5tn4q...8x6cxanehc0q',
  balance: 0.0013,
  privateKey: '0b7a981a9e78be5fe1d...df0c86bbc16808a7a3c',
  publicKey: '032ccc39e75eb254e393fd5...a63ce29ca5c0a5c6193029e2241a',
  sequence: 0
}

let tx = new BinanceTx(params)
    
let tx_params = {
  addressTo: 'bnb18mtwnkyd9...vspmp2f2ak',
  amount: 0.001225,
  fee: 0.000075,
  memo: 'hello'
}
const raw_tx = tx.make(tx_params).serialize() // rawTx => 'd201f0625dee0a4a2a2c87fa0a...0d73656e6420616c6c20746573742001'
const hash = tx.getHash() // hash =>  '245CBADAE28CD4B9F401B4...277A3098395AD0319C0'
```

## Nist testing
Testing [documentation](./nist/README.md).

## Created using
* [bip39](https://github.com/bitcoinjs/bip39)
* [bip39-checker](https://github.com/jcalfee/bip39-checker)
* [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
* [ethereumjs-tx](https://github.com/ethereumjs/ethereumjs-vm/tree/master/packages/tx)
* [ethereumjs-util](https://github.com/ethereumjs/ethereumjs-util)
* [hdkey](https://github.com/cryptocoinjs/hdkey)
* [web3-utils](https://github.com/ethereum/web3.js)
* [wif](https://github.com/bitcoinjs/wif)
* [worker-loader](https://github.com/webpack-contrib/worker-loader)
* [bitcore-lib-cash](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-lib-cash)
* [bchaddrjs](https://github.com/ealmansi/bchaddrjs)
## License

LumiCore is available under the MIT license. See the [LICENSE](LICENSE) file for more info.
