export const test_mnemonic = 'alpha win lawn boring invite provide useful clever amused swallow normal hurt'
export const test_fees = [
  {level: 'Regular', feePerByte: 3}
]

/*First Transaction*/
export const test_unspent = [
  {
    address: "ltc1q35te67uw7te6h2a0cgfus8jnvvwncjvtdk8nme",
    block_id: -1,
    derive_index: 0,
    index: 0,
    node_type: "external",
    transaction_hash: "fbc1b10f8b817fc70f6ff1976a30f8ba0308638ea7ea261187aa88b64696b636",
    value: 200000
  }
]

export const test_balance = test_unspent.reduce((a, b) => a + b.value, 0)
export const test_balance_ltc = test_balance / Math.pow(10, 8) // 0.00003 LTC
export const internal_address = 'ltc1qcjs2wfuwgvnvmrplclmmr57hnj8uavujh06jac'
export const recipient_address = 'ltc1q4947rqaw6tel66s6ramr8saruklcpmu4gfmu6p'

export const test_send_tx_data = {
  tx: '0100000000010136b69646b688aa871126eaa78e630803baf8306a97f16f0fc77f818b0fb1c1fb0000000000ffffffff02a086010000000000160014a96be183aed2f3fd6a1a1f7633c3a3e5bf80ef95f384010000000000160014c4a0a7278e4326cd8c3fc7f7b1d3d79c8fceb39202483045022100fffd6aa738ff78fdb4ee5e263b25ce6a0a82f774970ac9a13cff49e8750d531c022034667627d8cb072095d0e5cb61ad90f0bc379fdc76aa0f85159bc80095fb23540121023024b0785a51a98d310918818fd57061ea7cc70e13949f71bf6b8c7e0678303a00000000',
  hash: '470d368f3ae66e468154ecabc7fb33984c4564034065975afe330b9f722c6027'
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

/*Second Transaction*/

export const test_unspent_2 = [
  {
    address: "ltc1qcjs2wfuwgvnvmrplclmmr57hnj8uavujh06jac",
    block_id: 2085276,
    derive_index: 0,
    index: 1,
    node_type: "internal",
    transaction_hash: "470d368f3ae66e468154ecabc7fb33984c4564034065975afe330b9f722c6027",
    value: 99571
  }
]

export const test_balance_2 = test_unspent_2.reduce((a, b) => a + b.value, 0)
export const test_balance_ltc_2 = test_balance_2 / Math.pow(10, 8) // 0.00003 LTC
export const recipient_address_2 = 'ltc1qdy68cyjzjek8hmkjk35jjudyxppq9kg4mpgef4'

export const test_send_all_tx_data = {
  tx: '0100000000010127602c729f0b33fe5a9765400364454c9833fbc7abec5481466ee63a8f360d470100000000ffffffff01a68301000000000016001469347c1242966c7beed2b4692971a4304202d91502483045022100ff618753472b39073c3cacdbab179ceaf84c50a129158ea63859e438ce0553ba022015a8bec90ddda019b5daa4db315e655b61ff18990c3ab18fdacbcaa0c997a9c101210299f00f0249f221b96e1fc7b99df127589be9a263b430eb7394794e296c7252f000000000',
  hash: 'a56add62d101d72a3b365ab8844ee548ea9feac0e6944b28df21fb99ec242ded'
}

export function getDataTx(data = {}) {
  return {
    ...{
      unspent: test_unspent_2,
      balance: test_balance_2,
      feeList: test_fees,
      amount: 0,
      customFee: 0,
      nodes: {
        external: {},
        internal: {}
      }
    }, ...data
  }
}

export const test_fee_2 = {
  id: 'regular',
  SAT: 333,
  LTC: 0.00000333,
  value: 0.00000333,
  fee: 3,
  feeInBTC: 3e-8,
  inputs: [...test_unspent_2],
  inputsAmount: 99571,
  custom: false
}
