export const test_fees = [
  {level: 'Fast', feePerByte: 99},
  {level: 'Regular', feePerByte: 4},
  {level: 'Cheap but takes time', feePerByte: 2}
]
export const test_unspent = [
  {
    address: '1HdZE6j3uUtKfWuBGmnD73QhMUwN3dpTdD',
    confirmations: 1895,
    key: 'KxGrPQLH7MjdxsyjZA7uFQQBncoqHtmJtv7noXYRqPfvoEidGzWD',
    script: '76a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac',
    tx_hash: '7299be43ac70b479a74a1a9b286c3ad4b781dbba669e40252b762a271f2e640e',
    tx_hash_big_endian: '0e642e1f272a762b25409e66badb81b7d43a6c289b1a4aa779b470ac43be9972',
    tx_index: 0,
    tx_output_n: 0,
    value: 10000,
    value_hex: '2710'
  },
  {
    address: '163yM2KkaJ2qJrH64A1eRd98pxzkCP78XB',
    confirmations: 1362,
    key: 'L3UaW5hn7BWV7z9WY1JVikSwiGzxXh8QoneynEcC9WukR9Lysoy3',
    script: '76a91437687ed6bf262a1bc2199c242269c83a0b538b9488ac',
    tx_hash: 'd53e98c3508948ab15ccf11f2cf2de22eb6e4753218c99d7c2eb2eef92c18559',
    tx_hash_big_endian: '5985c192ef2eebc2d7998c2153476eeb22def22c1ff1cc15ab488950c3983ed5',
    tx_index: 0,
    tx_output_n: 0,
    value: 9215,
    value_hex: '23ff'
  },
  {
    address: '1C7nnTS7XLCJwNBuH21qxhtmQ2Ht5CSsZp',
    confirmations: 357,
    key: 'KxqAEjTvBF8gLGMRkh3tq3qSU5qVh8Z15NSkFDk23rDPgA1eorPA',
    script: '76a91479f21903f8052d96776e4102b905ef494f74814188ac',
    tx_hash: '91909e9b90bdf9e6763456d68ddb705c61e7d74571ac569c55dc626a2cd3436c',
    tx_hash_big_endian: '6c43d32c6a62dc559c56ac7145d7e7615c70db8dd6563476e6f9bd909b9e9091',
    tx_index: 0,
    tx_output_n: 1,
    value: 8980,
    value_hex: '2314'
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
