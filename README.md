[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://mit-license.org)
[![Version](https://img.shields.io/badge/Version-1.0-orange.svg)]()

![lumicore](https://user-images.githubusercontent.com/63342220/80406279-7c663380-88cc-11ea-8b06-07825767b288.png)

# LumiCore
The LumiCore library is an implementation of tools for working with Bitcoin and Ethereum. It allows to create and work with mnemonic following the BIP39 standard, to run the private/public keys derivation tree following the BIP44 standard and sign transactions.

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
You can create a new wallet by calling the method createNew(count). Count is the number of words for the new mnemonic.
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
    seedInHex: "1f53c65842ed3d0c54052f7f7315dbd9dcb...4af426ffb27234a0a571c44e29c1f4d1b181082e62d0a39",
    BTC: {
        node: Object,
        internalNode: Object,
        privateKey: Uint8Array(32),
        publicKey: Uint8Array(33),
        address: "1MS1SjQ1...vrLhajoGLfiV"
    },
    ETH: {
        node: Object,
        privateKey: Uint8Array(32),
        publicKey: Uint8Array(64),
        address: "0x06c019a17...aa6d949c947a02"
    }
}
```

### Derivation
You can get information about a child node using the method `getChildNodes`.
``` js
const data = {
  path: 'm/44'/0'/0'/0',
  from: 0,
  to: 20
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
            btcAddress: "1aVZBbZW...U6WvQF6w36H7",
            ethAddress: "0xcd1594ae...a74ceb13d889d"
        },
        ...
    ]
}

```
`path` this is a string with a derivation path. The path should begin with `m/44'`.
`from` is top of the range derivation
`to` is end of the range derivation

### Creating a BTC transaction
To create a Bitcoin transaction you need to send a set of inputs and outputs to the `makeRawBtcTx` method:
``` js
const data = {
    inputs: [
        {
            addr: "1BYRALP...ypWzTQE8BkEL",
            value: 10000,
            n: 0,
            script: "76a91473a2...07d0bff2aee345ac88ac",
            hash: "de06df091735...afd145eecfcd5649634e1d5221",
            key: 'L3YFJ4cBDYhZ...bzqgSUxLjTAorR5Kc47mP6x1D'
        },
        {
            addr: "1BYRALPU...kLypWzTQE8BkEL",
            value: 10000,
            n: 0,
            script: "76a91473a2...7d0bff2aee345ac88ac",
            hash: "47e497fd8f6f4...5c2043e0a3c7ee0463cbc68e9",
            key: 'L3YFJ4cBDYhZ...xLjTAorR5Kc4AorR5K7mP6x1D'
        }
      ],
      outputs: [
        {
          address: '1NuABwx...5V5tiXpshAWb8W',
          value: 15000
        }
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

For more information, see the [docs](https://lumiwallet.github.io/lumi-web-core/).

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
## License

LumiCore is available under the MIT license. See the [LICENSE](LICENSE) file for more info.
