export const test_fees = [
  {level: 'Regular', feePerByte: 3}
]

export const test_unspent = [
  {
    address: "ltc1qfyah6kgqukyl5u30zhawgyswhr4t229wpar07g",
    deriveIndex: 0,
    height: 0,
    nodeType: "external",
    tx: "01000000000101d6efb03b61db21e07bb4d7fdf970d7c8539c1999272902b7b340e09fd112937b0000000000ffffffff02a086010000000000160014493b7d5900e589fa722f15fae4120eb8eab528ae45243a010000000016001495cd0d9711f4070db5584b80dbda68352fdb9e0602473044022060683f1b545eafecb849f441d88035dc904a596fdbb570c9ae4b444bffc7f384022054a7340a6952629a64f2c6c97ff18e2dab71d00014635ef2ced77227def4f45301210210b66a88f70c904b297374b05ee7e7e358bb40afdd53a4b4dbdf69915799e63a00000000",
    tx_hash: "8397743b17e2c539d700257e93a7b5ebdaf517661806331517df061dfc54e04e",
    tx_pos: 0,
    value: 100000
  }
]

export const test_balance = test_unspent.reduce((a, b) => a + b.value, 0)
export const test_balance_ltc = test_balance / Math.pow(10, 8) // 0.00003 BCH
export const internal_address = 'ltc1qfyah6kgqukyl5u30zhawgyswhr4t229wpar07g'
export const recipient_address = 'ltc1qldzhtt2zs7ucgrj3xllflj8fz7zpyftdjwjhzr'
export const test_mnemonic = 'alpha win lawn boring invite provide useful clever amused swallow normal hurt'
export const test_tx_data = {
  tx: '01000000000101483329c7e67d5431dc5b26ab8b0cadf12fbc9bb5598ab42bd07a8ff89bad876e0000000000ffffffff02e803000000000000160014269c3b32266249597d8ee0fd307fbe6fc9269f1223060000000000001600143fd898b14eaa3562c8dc948acff22123d56ff66e0247304402205e7bf9330bd3b83e106d797f31ccc6c250150ca2111b5c220f41e52accb74c9c02207a34ec63bde372c73cd8da547ed65da7c560334307782996b0d6440be4d2c272012103abe0ae0f6792f6fe3fa6855db1c07c5c6d8daeeb40e248438119513fb455d38100000000',
  hash: '98f5f94267101de83364293a7ba4c9a588eb4a9c74a26a05b90d4381f9479710'
}
export const test_send_all_tx_data = {
  tx: '01000000000101d6efb03b61db21e07bb4d7fdf970d7c8539c1999272902b7b340e09fd112937b0000000000ffffffff02a086010000000000160014493b7d5900e589fa722f15fae4120eb8eab528ae45243a010000000016001495cd0d9711f4070db5584b80dbda68352fdb9e0602473044022060683f1b545eafecb849f441d88035dc904a596fdbb570c9ae4b444bffc7f384022054a7340a6952629a64f2c6c97ff18e2dab71d00014635ef2ced77227def4f45301210210b66a88f70c904b297374b05ee7e7e358bb40afdd53a4b4dbdf69915799e63a00000000',
  hash: '8397743b17e2c539d700257e93a7b5ebdaf517661806331517df061dfc54e04e'
}
export const test_fee = {
  id: 'regular',
  SAT: 333,
  LTC: 0.00000333,
  fee: 3,
  feeInBTC: 3e-8,
  inputs: [...test_unspent],
  inputsAmount: 100000,
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
