export const test_fees = [
  {level: 'Regular', feePerByte: 3}
]

export const test_unspent = [
  {
    address: "royale1qwvd3knuqk9n6xl4773dvag4qav7amurwd43pu8",
    deriveIndex: 0,
    height: 0,
    nodeType: "external",
    tx_hash: "6e87ad9bf88f7ad02bb48a59b59bbc2ff1ad0c8bab265bdc31547de6c7293348",
    tx_pos: 0,
    value: 3000
  }
]

export const test_balance = test_unspent.reduce((a, b) => a + b.value, 0)
export const test_balance_btcv = test_balance / Math.pow(10, 8) // 0.00003 BCH
export const internal_address = 'royale1q8lvf3v2w4g6k9jxujj9vlu3py02klanwmzshvk'
export const recipient_address = 'royale1qy6wrkv3xvfy4jlvwur7nqla7dlyjd8cj83kdn0'
export const test_mnemonic = 'magic disorder cable gym napkin gather relief vapor daring main capable armor'
export const test_tx_data = {
  tx: '01000000000101483329c7e67d5431dc5b26ab8b0cadf12fbc9bb5598ab42bd07a8ff89bad876e0000000000ffffffff02e803000000000000160014269c3b32266249597d8ee0fd307fbe6fc9269f1223060000000000001600143fd898b14eaa3562c8dc948acff22123d56ff66e0247304402205e7bf9330bd3b83e106d797f31ccc6c250150ca2111b5c220f41e52accb74c9c02207a34ec63bde372c73cd8da547ed65da7c560334307782996b0d6440be4d2c272012103abe0ae0f6792f6fe3fa6855db1c07c5c6d8daeeb40e248438119513fb455d38100000000',
  hash: '98f5f94267101de83364293a7ba4c9a588eb4a9c74a26a05b90d4381f9479710'
}
export const test_send_all_tx_data = {
  tx: '01000000000101483329c7e67d5431dc5b26ab8b0cadf12fbc9bb5598ab42bd07a8ff89bad876e0000000000ffffffff016b0a000000000000160014269c3b32266249597d8ee0fd307fbe6fc9269f1202483045022100e16f2f40e00ff26155307b28361fb91b5a0821bbd6413d2d82abb3b6579d181d0220625bc11aef1d11134f95fdfcc26e9c786f57a3c618de186f68288d601373a78e012103abe0ae0f6792f6fe3fa6855db1c07c5c6d8daeeb40e248438119513fb455d38100000000',
  hash: '759f8352bded44a60fbbb23ac9cbd5df9b2ca4486fc40c013e56e33ebc2d0d31'
}
export const test_fee = {
  id: 'regular',
  SAT: 333,
  BTCV: 0.00000333,
  fee: 3,
  feeInBTC: 3e-8,
  inputs: [...test_unspent],
  inputsAmount: 3000,
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
