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
