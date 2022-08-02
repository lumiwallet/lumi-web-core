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
