export const test_fees = [
  {level: 'Fast', feePerByte: 99},
  {level: 'Regular', feePerByte: 4},
  {level: 'Cheap but takes time', feePerByte: 2}
]
export const test_unspent = [
  {
    address: 'bc1qwds7c6u5q9kcw88nhx9r587v65tqx0et0kc24c',
    key: 'L4sVqqcR7ydQsL6iPspuuHgawbbvsCA7QdtMVqeXG9r8DigVzkqN',
    script: '76a914b66be3501d119fd998e2e1d9b156644c92820d0d88ac',
    tx_hash: 'c4aa6886cf6e2e667457c10b3c485fbbae06e0b71e8e334fcd2ebc7016b3b01b',
    tx_hash_big_endian: '1bb0b31670bc2ecd4f338e1eb7e006aebb5f483c0bc15774662e6ecf8668aac4',
    tx_index: 1,
    tx_output_n: 1,
    value: 3627,
    value_hex: '000e2b'
  },
  {
    address: 'bc1q6duxh4wn0yra346l67psurshhrvh97csgw3de7',
    derive_index: 1,
    key: 'Ky9wSZcKm4h3x9mCLoGbCuF9N8MNpYMmoHU69Kg2Wn5TEfEKjQUw',
    script: '00149e605d026fdb13564f1ef014841e8e2ce05b91ef',
    tx_hash: '9fff7e2b36c71cea053a6715ab5375dbcaf4d8814aea3e85a74dd9d82e09e5a8',
    tx_hash_big_endian: 'a8e5092ed8d94da7853eea4a81d8f4cadb7553ab15673a05ea1cc7362b7eff9f',
    tx_index: 1,
    tx_output_n: 1,
    value: 2306,
    value_hex: '000902'
  }
]
export const test_balance = test_unspent.reduce((a, b) => a + b.value, 0)
export const test_tx_data = {
  hash: 'ac693bf8fbcb808d544e3261eb890d613d664271eaf6b16b1b2f0dfdbd1d3b61',
  tx: '01000000000102c4aa6886cf6e2e667457c10b3c485fbbae06e0b71e8e334fcd2ebc7016b3b01b0100000000ffffffff9fff7e2b36c71cea053a6715ab5375dbcaf4d8814aea3e85a74dd9d82e09e5a80100000000ffffffff02b80b000000000000160014986f6377c6aa03e4a3f52d275b8d530bd506131e2908000000000000160014b17333549389879edaf370826a3db771bb90f8ad02473044022031fdf56ae2088f7c65ab3ef3d3341b87e0909d9795665b30274037cce0e55dff02204b856643c73a0908837e7e7f0cc3b5dc3954963a5b4882fa815192426982dc0f01210322cbebd7d20142dabf2537939a0e47f747ad85af85ab17547c45e4d611411a4802483045022100aff4b1bdb2c5a9b6216c5d9aa6202e996b5e1d49775f3b7fab64d716c069bde30220630dcac3b0463f797ea1683ece7779d73959f2536cec668ef8767c27f07b1cc6012103405345dd3b44eb396afa1b67c0a7deba50b9d8b540488884b99e0ee031de37f300000000'
}
export const internal_address = 'bc1qk9enx4yn3xreakhnwzpx50dhwxaep79dv3se28'
export const recipient_address = 'bc1qnphkxa7x4gp7fgl495n4hr2np02svyc7kz6scn'

export function getData (data = {}) {
  return {
    ...{
      unspent: test_unspent,
      balance: test_balance,
      feeList: test_fees,
      amount: 0,
      customFee: 0,
      internalAddress: internal_address,
      type: 'p2wpkh'
    }, ...data
  }
}
