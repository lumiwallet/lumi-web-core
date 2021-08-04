### Creating an XDC transaction
To make a Xinfin transaction you need to fill in the following params:
``` js
const data = {
    nonce: 4,
    value: 100000000000000,
    to: '0x1e8d99d2278...d89983e2920df33b485',
    gasPrice: 2500,
    gasLimit: 21000,
    privateKey: '0xd27c8544f946bd2a5456...d174e64e4a03030917bb8313'
}

const xdc_tx = await WALLET.makeRawEthTx(data)
```

When the transaction is created successfully, an object with the transaction hash and raw tx data is returned
``` js
eth_tx => {
    hash: '0xc81100f9ad8bf0dcd4f2...2e638512bf759af0ddf7e44db',
    tx: '0xf86a048209c4825208945...e150193c40ba54a22f9fb1bfed52181193fabc'
}
```
