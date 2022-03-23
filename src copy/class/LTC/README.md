### Creating a LTC transaction
To create a Litecoin transaction you need to send a set of inputs and outputs to the `makeRawLtcTx` method:
``` js
const data = {
    inputs: [
        {
            address: "ltc1q35t...tdk8nme",
            hash: "fbc1b10f...8b64696b636",
            index: 0,
            key: "L2J3LL5KAGo6rZMW...AhZt4kUDdD74",
            value: 200000 
        }
    ],
    outputs: [
        {
            address: "ltc1q4947rq...pmu4gfmu6p",
            value: 100000
        },
        {
            address: "ltc1qcjs2wf...7hnj8uavujh06jac",
            value: 99571
        }
    ]
}

const ltc_tx = await WALLET.makeRawLtcTx(data)
```
When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
ltc_tx => {
    tx: '0100000000010...7e0678303a00000000',
    hash: '470d368f3...b9f722c6027'
}
```
