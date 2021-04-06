export const test_fees = [
  {level: 'Fast', feePerByte: 99},
  {level: 'Regular', feePerByte: 4},
  {level: 'Cheap but takes time', feePerByte: 2}
]
export const test_unspent = [
  {
    address: '1HdZE6j3uUtKfWuBGmnD73QhMUwN3dpTdD',
    key: 'KxGrPQLH7MjdxsyjZA7uFQQBncoqHtmJtv7noXYRqPfvoEidGzWD',
    script: '76a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac',
    transaction_hash: '0e642e1f272a762b25409e66badb81b7d43a6c289b1a4aa779b470ac43be9972',
    index: 0,
    value: 10000,
    tx: '0100000001a8a44655a38ae794fc88435064a068298ab3a991c60676ec1233816750a08172010000006b48304502210086675e4f49eee9db83b418a68fcf3fa94f2635c10b14a054b4fce08d42de8d2f02201466e8bf6b21c23884a808c813c80ea9e2cee5f22ef1a102ffa79a68d91fa29b0121036d8a25381630b3341328aebd73c9499e17294905a9c0d66277e2f3a64b6fa2baffffffff0210270000000000001976a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac92960200000000001976a914fab11b07f3b0bfd9919b3e51569de70a87f06b8f88ac00000000'
  },
  {
    address: '163yM2KkaJ2qJrH64A1eRd98pxzkCP78XB',
    key: 'L3UaW5hn7BWV7z9WY1JVikSwiGzxXh8QoneynEcC9WukR9Lysoy3',
    script: '76a91437687ed6bf262a1bc2199c242269c83a0b538b9488ac',
    transaction_hash: '5985c192ef2eebc2d7998c2153476eeb22def22c1ff1cc15ab488950c3983ed5',
    index: 0,
    value: 9215,
    tx: '010000000108ea1524202748af4fbcc5187235fc4826da165acf26c1bd3ab88af394992c36000000006a47304402203da2c4bb05edd8a6007fa448e8276b24b991ae56c545f14bba0a35a5544afc610220333b9d7b58f0e2be7e28d600e475ce84195d6a2369d5d903b0d9d4eaf4c02165012102e9b517c336b4c360165cffbcdc269aaaba4f56a30da4f8513838e934ff6726b3ffffffff02ff230000000000001976a91437687ed6bf262a1bc2199c242269c83a0b538b9488acdca10000000000001976a914830986cee8c78a5b2e9a591972a72e168a9e03cf88ac00000000'
  },
  {
    address: '1C7nnTS7XLCJwNBuH21qxhtmQ2Ht5CSsZp',
    key: 'KxqAEjTvBF8gLGMRkh3tq3qSU5qVh8Z15NSkFDk23rDPgA1eorPA',
    script: '76a91479f21903f8052d96776e4102b905ef494f74814188ac',
    transaction_hash: '6c43d32c6a62dc559c56ac7145d7e7615c70db8dd6563476e6f9bd909b9e9091',
    index: 1,
    value: 8980,
    tx: '01000000015b742a320ec5cc728f5753670c39bbf5c27934b81a0a130ad329450512b4e96f010000006a47304402207fb032439b5506aed80f30f179604f10ab7b6ef53e1c950ade4920e4e4fdcf06022050ea4b7935251102d3644d2cfdb08acf4179a0516ab261b3aaec9a3b01832469012103789e0924298008a05f45500d5af2242d9eb2bdbdaf6488ec97bf8ad28990a534ffffffff02204e0000000000001976a914b3dd3fad663281642bdd9682c92ebfa6c5e98f1088ac14230000000000001976a91479f21903f8052d96776e4102b905ef494f74814188ac00000000'
  }
]
export const test_unspent_without_tx = [
  {
    address: '1HdZE6j3uUtKfWuBGmnD73QhMUwN3dpTdD',
    key: 'KxGrPQLH7MjdxsyjZA7uFQQBncoqHtmJtv7noXYRqPfvoEidGzWD',
    script: '76a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac',
    transaction_hash: '0e642e1f272a762b25409e66badb81b7d43a6c289b1a4aa779b470ac43be9972',
    index: 0,
    value: 10000,
    tx: ''
  },
  {
    address: '163yM2KkaJ2qJrH64A1eRd98pxzkCP78XB',
    key: 'L3UaW5hn7BWV7z9WY1JVikSwiGzxXh8QoneynEcC9WukR9Lysoy3',
    script: '76a91437687ed6bf262a1bc2199c242269c83a0b538b9488ac',
    transaction_hash: '5985c192ef2eebc2d7998c2153476eeb22def22c1ff1cc15ab488950c3983ed5',
    index: 0,
    value: 9215,
    tx: ''
  },
  {
    address: '1C7nnTS7XLCJwNBuH21qxhtmQ2Ht5CSsZp',
    key: 'KxqAEjTvBF8gLGMRkh3tq3qSU5qVh8Z15NSkFDk23rDPgA1eorPA',
    script: '76a91479f21903f8052d96776e4102b905ef494f74814188ac',
    transaction_hash: '6c43d32c6a62dc559c56ac7145d7e7615c70db8dd6563476e6f9bd909b9e9091',
    index: 1,
    value: 8980,
    tx: ''
  }
]

export const invalid_unspent = [
  {
    address: '1HdZE6j3uUtKfWuBGmnD73QhMUwN3dpTdD',
    key: 'KxGrPQLH7MjdxsyjZA7uFQQBncoqHtmJtv7noXYRqPfvoEidGzWD',
    script: '76a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac',
    index: 0,
    value: 10000
  },
  {
    address: '163yM2KkaJ2qJrH64A1eRd98pxzkCP78XB',
    key: 'L3UaW5hn7BWV7z9WY1JVikSwiGzxXh8QoneynEcC9WukR9Lysoy3',
    script: '76a91437687ed6bf262a1bc2199c242269c83a0b538b9488ac',
    index: 0,
    value: 9215
  }
]
export const raw_txs = [
  {
    'hash': '0e642e1f272a762b25409e66badb81b7d43a6c289b1a4aa779b470ac43be9972',
    'rawData': '0100000001a8a44655a38ae794fc88435064a068298ab3a991c60676ec1233816750a08172010000006b48304502210086675e4f49eee9db83b418a68fcf3fa94f2635c10b14a054b4fce08d42de8d2f02201466e8bf6b21c23884a808c813c80ea9e2cee5f22ef1a102ffa79a68d91fa29b0121036d8a25381630b3341328aebd73c9499e17294905a9c0d66277e2f3a64b6fa2baffffffff0210270000000000001976a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac92960200000000001976a914fab11b07f3b0bfd9919b3e51569de70a87f06b8f88ac00000000'
  },
  {
    'hash': '5985c192ef2eebc2d7998c2153476eeb22def22c1ff1cc15ab488950c3983ed5',
    'rawData': '010000000108ea1524202748af4fbcc5187235fc4826da165acf26c1bd3ab88af394992c36000000006a47304402203da2c4bb05edd8a6007fa448e8276b24b991ae56c545f14bba0a35a5544afc610220333b9d7b58f0e2be7e28d600e475ce84195d6a2369d5d903b0d9d4eaf4c02165012102e9b517c336b4c360165cffbcdc269aaaba4f56a30da4f8513838e934ff6726b3ffffffff02ff230000000000001976a91437687ed6bf262a1bc2199c242269c83a0b538b9488acdca10000000000001976a914830986cee8c78a5b2e9a591972a72e168a9e03cf88ac00000000'
  },
  {
    'hash': '6c43d32c6a62dc559c56ac7145d7e7615c70db8dd6563476e6f9bd909b9e9091',
    'rawData': '01000000015b742a320ec5cc728f5753670c39bbf5c27934b81a0a130ad329450512b4e96f010000006a47304402207fb032439b5506aed80f30f179604f10ab7b6ef53e1c950ade4920e4e4fdcf06022050ea4b7935251102d3644d2cfdb08acf4179a0516ab261b3aaec9a3b01832469012103789e0924298008a05f45500d5af2242d9eb2bdbdaf6488ec97bf8ad28990a534ffffffff02204e0000000000001976a914b3dd3fad663281642bdd9682c92ebfa6c5e98f1088ac14230000000000001976a91479f21903f8052d96776e4102b905ef494f74814188ac00000000'
  }
]
export const test_balance = test_unspent.reduce((a, b) => a + b.value, 0) // 28195 sat
export const test_balance_btc = test_balance / Math.pow(10, 8)
export const test_tx_data = {
  hash: '7b735b7cb3048c0a370d74f39b9436779e742d928c6fb7be5129445ac79da2dc',
  tx: '01000000017299be43ac70b479a74a1a9b286c3ad4b781dbba669e40252b762a271f2e640e000000006a473044022071df7863df0a72e023fa2d8f940cd76972843c08985c3d72a7957e1d11bc133e022064bf9498fdd03b33baa9b0317fb58d71b1c64a920d4719528becc742c2bf22c5012103d78a5925cbf75652e0d1d58841136cdd2f5bfdd4f3c7b9e5e60a0acc0d2a07bbffffffff02e8030000000000001976a914365ab740e0cb11718e112525508f380a30cd1f3288ac64210000000000001976a914e3c4908525ff735ec069f7b5368677a42e96885f88ac00000000'
}
export const internal_address = '1MmKs693pT7bw3Nxe4AKhFe7FzUY2x4izo'
export const recipient_address = '15xQAQWzpSf8Qjq4UvvtpSXk88KnCGixEa'
export const test_fee = {
  id: 'regular',
  SAT: 1952,
  BTC: 0.00001952,
  fee: 4,
  feeInBTC: 4e-8,
  inputs: [...test_unspent],
  inputsAmount: 28195,
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
      internalAddress: internal_address
    }, ...data
  }
}
