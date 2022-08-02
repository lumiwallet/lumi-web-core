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
