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
