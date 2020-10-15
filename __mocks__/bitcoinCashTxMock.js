export const test_fees = [
  {level: 'Regular', feePerByte: 3}
]

export const test_unspent = [
  {
    nodeType: 'external',
    deriveIndex: 0,
    legacyAddress: '1657JTP3m3hqnhpS6EkRe2iJ5pFAA75HrD',
    cashAddress: 'qqmelrtj5r8vynz8mvc8m8auuz9jxa8m7u8kg7m0xe',
    vout: 0,
    satoshis: 140000,
    scriptPubKey: '76a914379f8d72a0cec24c47db307d9fbce08b2374fbf788ac',
    txid: 'b76b7373961c49bf8850047c4304383094a3da4e18ad436f4b741b17457103d7',
  },
  {
    nodeType: 'external',
    deriveIndex: 0,
    legacyAddress: '1657JTP3m3hqnhpS6EkRe2iJ5pFAA75HrD',
    cashAddress: 'qqmelrtj5r8vynz8mvc8m8auuz9jxa8m7u8kg7m0xe',
    vout: 0,
    satoshis: 1200000,
    scriptPubKey: '76a914379f8d72a0cec24c47db307d9fbce08b2374fbf788ac',
    txid: 'b317dbfe7594cc41a22de934d86929c0ac11c94e212812a017495a2df8fae4ab',
  }
]

export const test_balance = test_unspent.reduce((a, b) => a + b.satoshis, 0) // 1340000 sat
export const test_balance_bch = test_balance / Math.pow(10, 8) // 0.0134 BCH
export const internal_address = '1A4eD3w4Bi3dpSVx4hC3ti9pMk54zv9QPx'
export const recipient_address = '115uEfQMqpZXWbbyLBqx9m9oa3szkoWm4e'
export const test_mnemonic = 'sick cat cry material siren orient essence frog finish banana one move'
export const test_tx_data = {
  tx: '0200000001d7037145171b744b6f43ad184edaa394303804437c045088bf491c9673736bb7000000006a47304402207032f07eb1a5cab1e64c0290dc9fa5dd1b95dbf110754adca28de6e4465dce1702203a53edda9f9d7b5b8e27baad55523890446d4b55d5d9e0da190ef0e960bdf3204121036f72858855812bc33bcff2c31cb53ad5aba89ec8cd5ccbb9446f835f0b96693affffffff02a0860100000000001976a91400ed44948a012a00239273e0af1ce3e63a32ddce88ac9a990000000000001976a9146369707dd52c9543665982cb12ab747eb045de3e88ac00000000',
  hash: 'b07375169b184c9f335aa01ecbd1e8402868454e4d9f27158ee23ceeb953e293'
}
export const test_send_all_tx_data = {
  tx: '0200000002d7037145171b744b6f43ad184edaa394303804437c045088bf491c9673736bb7000000006a473044022064c3c0b367a44c37d7dfdfb83c28bbade253007999386fa367f3f87534a3298b02203b4720541693bfda0f0b4d17f785670f11f7622a94018f560ab36c91b1bbf0414121036f72858855812bc33bcff2c31cb53ad5aba89ec8cd5ccbb9446f835f0b96693affffffffabe4faf82d5a4917a01228214ec911acc02969d834e92da241cc9475fedb17b3000000006a473044022040e52bc65f23711ad1fdc3141b4ed7b1309486f521151b2a97ad02e258a94f7002201a764bc9adb098ef8aaf39a65e5ceb02e3aedf57244d214c28b3f22fc9b3ecfe4121036f72858855812bc33bcff2c31cb53ad5aba89ec8cd5ccbb9446f835f0b96693affffffff01646e1400000000001976a91400ed44948a012a00239273e0af1ce3e63a32ddce88ac00000000',
  hash: '104fb9c4316d0c1dfeb202f66e898f53ed9953cc28801db8633029d330b088b1'
}
export const test_fee = {
  id: 'regular',
  SAT: 1020,
  BCH: 0.0000102,
  fee: 3,
  feeInBTC: 3e-8,
  inputs: [...test_unspent],
  inputsAmount: 1340000,
  custom: false
}

export function getData (data = {}) {
  return {
    ...{
      unspent: test_unspent,
      balance: test_balance,
      feeList: test_fees,
      amount: 0,
      customFee: 0,
      internalAddress: internal_address,
      nodes: {
        external: {},
        internal: {}
      }
    }, ...data
  }
}
