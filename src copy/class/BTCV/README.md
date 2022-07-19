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
