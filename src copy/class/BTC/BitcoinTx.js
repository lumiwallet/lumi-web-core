// import converter from '@/helpers/converters'
// import {calcBtcTxSize, getBtcPrivateKeyByIndex, makeRawBtcTx} from '@/helpers/coreHelper'
// import CustomError from '@/helpers/handleErrors'
// import Request from '@/helpers/Request'
//
// /**
//  * List of available commission types for Bitcoin transactions
//  * @type {Array}
//  */
//
// const FEE_IDS = ['fast', 'regular', 'cheap', 'custom']
//
// /**
//  * Class BitcoinTx.
//  * This class is responsible for calculating the fee,
//  * calculating the available amount to send, and generating and signing a Bitcoin transaction
//  * @class
//  */
//
// export default class BitcoinTx {
//   /**
//    * Create a BitcoinTx
//    * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
//    * @param {Array} data.unspent - Array of unspent addresses
//    * @param {string} data.internalAddress - Address for change
//    * @param {number} data.amount - Transaction amount
//    * @param {number} data.balance - Bitcoin wallet balance
//    * @param {Array} data.feeList - Set of bitcoin fees
//    * @param {Object} data.customFee - Custom fee entered by the user
//    * @param {Object} data.nodes - External and internal nodes required to generate private keys
//    * @param {String} data.type - Bitcoin type. There may be p2pkh or p2wpkh
//    * @param {Object} data.headers - Request headers
//    */
//
//   constructor (data) {
//     this.unspent = data.unspent
//     // this.internalAddress = data.internalAddress
//     // this.amount = data.amount ? converter.btc_to_sat(data.amount) : 0
//     this.balance = this.unspent.reduce((a, b) => a + b.value, 0)
//     this.dust = 1000
//     this.fee = data.feeList
//     // this.customFee = +data.customFee || 0
//     this.nodes = data.nodes || {}
//     this.feeList = []
//     this.request = new Request(data.api, data.headers)
//     this.type = data.type ? data.type.toLowerCase() : 'p2pkh'
//   }
//
//   /**
//    * Calculating the fee amount
//    * @param {number} size - Transaction size
//    * @returns {Promise<Array>} Returns a set of fees for a specific transaction amount
//    */
//
//   async calcFee (size = 0) {
//     const fees = [...this.fee.map(item => item.feePerByte), this.customFee]
//
//     if (this.amount <= 0 || this.balance < this.amount) {
//       return this.calcEmptyFee(fees)
//     }
//
//     const pArray = fees.map(async fee => {
//       return await this.getInputs(fee, size)
//     })
//
//     const res = await Promise.all(pArray)
//
//     this.feeList = res.map((item, i) => {
//       return {
//         id: FEE_IDS[i],
//         SAT: item.fee,
//         BTC: converter.sat_to_btc(item.fee),
//         fee: fees[i],
//         feeInBTC: converter.sat_to_btc(fees[i]),
//         inputs: item.inputs,
//         inputsAmount: item.inputsAmount,
//         custom: FEE_IDS[i] === 'custom'
//       }
//     })
//
//     return this.feeList
//   }
//
//   /**
//    * Sets an array of zero fees.
//    * Used when the user does not have enough funds for the transaction
//    * @returns {Array} Returns an array with zero fees
//    */
//
//   calcEmptyFee (fees) {
//     this.feeList = fees.map((item, i) => {
//       return {
//         id: FEE_IDS[i],
//         SAT: 0,
//         BTC: 0,
//         fee: item,
//         feeInBTC: converter.sat_to_btc(item),
//         inputs: [],
//         inputsAmount: 0,
//         custom: FEE_IDS[i] === 'custom'
//       }
//     })
//
//     return this.feeList
//   }
//
//   /**
//    * Finds a list of inputs for a specific transaction
//    * @param {number} fee - Fee size
//    * @param {number} size - Transaction size
//    * @returns {Promise<Object>} Returns an object with a list of inputs, the total fee amount, and the total amount of all inputs
//    */
//
//   async getInputs (fee, size) {
//     let index = 0
//     let inputsAmount = 0
//     let inputs = []
//     let res = {}
//
//     this.dust = size ? 0 : 1000
//
//     let req = async () => {
//       let item = this.unspent[index]
//       let defaultSize = calcBtcTxSize(index + 1, 2, this.type === 'p2wpkh')
//       let calcFee = size ? size * fee : defaultSize * fee
//
//       inputsAmount += item.value
//       inputs.push(item)
//
//       let total = this.amount + calcFee + this.dust
//
//       if (total > inputsAmount) {
//         index++
//
//         if (index >= this.unspent.length) {
//           res = {
//             fee: 0,
//             inputs: [],
//             inputsAmount: 0
//           }
//         } else {
//           await req()
//         }
//       } else {
//         res = {
//           fee: calcFee,
//           inputs: inputs,
//           inputsAmount: inputsAmount
//         }
//       }
//     }
//     await req()
//
//     return res
//   }
//
//   /**
//    * Creating a Bitcoin transaction
//    * @param {Object} data - Input data for a transaction
//    * @param {string} data.addressTo - Recipient address
//    * @param {Object} data.fee - The transaction fee and list of inputs
//    * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
//    */
//
//   async make (data) {
//     const {addressTo, fee} = data
//
//     if (!this.amount) {
//       throw new CustomError('err_tx_btc_amount')
//     }
//
//     if (isNaN(fee.SAT)) {
//       throw new CustomError('err_tx_btc_fee')
//     }
//
//     let change = +fee.inputsAmount - +this.amount - +fee.SAT
//     let inputs = []
//
//     try {
//       inputs = await this.getInputsWithTxInfo(fee.inputs)
//     }
//     catch (e) {
//       throw new Error(e.message)
//     }
//
//     if (change >= 0) {
//       let params = {
//         inputs: inputs,
//         outputs: [
//           {
//             address: addressTo,
//             value: this.amount
//           }
//         ]
//       }
//
//       if (change) {
//         params.outputs[1] = {
//           address: this.internalAddress,
//           value: change
//         }
//       }
//
//       return makeRawBtcTx(params)
//     } else {
//       throw new CustomError('err_tx_btc_balance')
//     }
//   }
//
//   /**
//    * Returns the required data to create a transaction
//    * @param {Array} inputs - Array of inputs for tx
//    * @returns {Promise<Array>} Returns an array of inputs with a private keys and raw transaction data for p2pkh items
//    */
//
//   async getInputsWithTxInfo (inputs) {
//     try {
//       let rawTxsData = []
//       let finalInputs = []
//
//       if (this.type === 'p2pkh') {
//         let hashes = []
//
//         for (let input of inputs) {
//           if (!input.tx) {
//             if (input.transaction_hash) {
//               hashes.push(input.transaction_hash)
//             } else {
//               throw new CustomError('err_tx_btc_unspent')
//             }
//           }
//         }
//         const unique_hashes = [...new Set(hashes)]
//
//         rawTxsData = await this.getRawTxHex(unique_hashes)
//
//         for (let input of inputs) {
//           let item = {
//             hash: input.transaction_hash,
//             index: input.index,
//             address: input.address,
//             value: input.value
//           }
//           if (!input.tx) {
//             let data = rawTxsData.find(item => item.hash === input.transaction_hash)
//             item.tx = data ? data.rawData : null
//           } else {
//             item.tx = input.tx
//           }
//           item.key = input.key || getBtcPrivateKeyByIndex(this.nodes[input.node_type], input.derive_index)
//
//           finalInputs.push(item)
//         }
//       } else {
//         for (let input of inputs) {
//           let item = {
//             hash: input.transaction_hash,
//             index: input.index,
//             address: input.address,
//             value: input.value
//           }
//           item.key = input.key || getBtcPrivateKeyByIndex(this.nodes[input.node_type], input.derive_index)
//
//           finalInputs.push(item)
//         }
//       }
//
//       return finalInputs
//     }
//     catch (e) {
//       throw new Error(e.message)
//     }
//   }
//
//   /**
//    * Raw transaction request
//    * @param {Array} hashes - List of hashes
//    * @returns {Promise<Array>} Array of raw Bitcoin transactions for each hash
//    */
//
//   async getRawTxHex (hashes) {
//     if (!hashes || !hashes.length) return []
//
//     const ARRAY_SIZE = 10
//     const ARRAYS_COUNT = Math.ceil(hashes.length / ARRAY_SIZE)
//     let txs = []
//     let arrays = []
//     let counter = 0
//
//     for (let i = 0; i < ARRAYS_COUNT; i++) {
//       arrays[i] = hashes.slice((i * ARRAY_SIZE), (i * ARRAY_SIZE) + ARRAY_SIZE)
//     }
//
//     const req = async () => {
//       try {
//         let res = await this.request.send({
//           method: 'rawtx',
//           txs: arrays[counter]
//         })
//
//         if (res.status === 'success' && res.data.length) {
//           txs = [...txs, ...res.data]
//           counter++
//
//           if (counter !== ARRAYS_COUNT) {
//             await req()
//           }
//         } else {
//           throw new CustomError('err_tx_btc_raw_tx')
//         }
//       }
//       catch (e) {
//         throw new CustomError('err_tx_btc_raw_tx')
//       }
//     }
//
//     await req()
//
//     return txs
//   }
// }
