import Request                          from '@/helpers/Request'
import {getBtcAddress, privateKeyToWIF} from '@/helpers/coreHelper'
import * as bitcoin                     from 'bitcoinjs-lib'

/**
 * Class BitcoinSync.
 * This class allows you to get information about the balance on a Bitcoin wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export default class BitcoinSync {
  /**
   * Create a BitcoinSync
   * @param {Object} externalNode - External Bitcoin node
   * @param {Object} internalNode - Internal Bitcoin node
   * @param {Object} api - A set of URLs for getting information about Bitcoin addresses
   */
  // todo docs
  constructor (externalNode, internalNode, api, format) {
    this.externalNode = externalNode
    this.internalNode = internalNode
    this.api = api
    this.balance = 0
    this.latestBlock = 0
    this.unspent = []
    this.addresses = {
      external: [],
      internal: [],
      empty: {},
      all: []
    }
    this.deriveAddress = {
      internal: {},
      external: {}
    }
    this.transactions = {
      all: [],
      unique: []
    }
    this.fee = []
    this.request = new Request(this.api.bitcoin)
    this.format = format || 'p2pkh'
  }
  
  /**
   * The method that starts the synchronization Bitcoin part of wallet
   * @returns {Promise<boolean>}
   * @constructor
   */
  
  async Start () {
    this.transactions = {
      all: [],
      unique: []
    }
    this.unspent = []
    await Promise.all([
      await this.getAddresses(),
      await this.getFeesRequest()
    ])
  }
  
  /**
   * Getting internal and external addresses that were involved in transactions
   * @returns {Promise<boolean>}
   */
  
  async getAddresses () {
    const nodeData = [
      {
        node: this.externalNode,
        type: 'external'
      }, {
        node: this.internalNode,
        type: 'internal'
      }
    ]
    
    const pArray = nodeData.map(async item => {
      return await this.getAddressesByNode(
        item.node,
        item.type
      )
    })
    
    const addresses = await Promise.all(pArray)
    
    this.addresses.external = addresses[0]
    this.addresses.internal = addresses[1]
    this.addresses.empty = {
      external: this.addresses.external[this.addresses.external.length - 1],
      internal: this.addresses.internal[this.addresses.internal.length - 1]
    }
    
    this.addresses.all = [...this.addresses.external, ...this.addresses.internal].map((item) => item.address)
    
    await this.processTransactions()
    await this.getTxInfoForUnspent()
    this.getBalance(this.unspent)
  }
  
  /**
   * Auxiliary method that gets the Bitcoin address by node and index
   * @param {Object} node - Bitcoin node
   * @param {string} type - Node type (external or internal)
   * @param {number} from - The index that the derivation starts from
   * @param {number} to - Index to which deprivation occurs
   * @returns {Promise<Array>} Returns array of addresses
   * @private
   */
  
  async _getArrayOfAddresses (node, type, from, to) {
    let addresses = []
    
    for (let i = from; i < to; i++) {
      let address = ''
      
      if (this.deriveAddress[type].hasOwnProperty(i)) {
        address = this.deriveAddress[type][i]
      } else {
        address = getBtcAddress(node, i, this.format)
        this.deriveAddress[type][i] = address
      }
      
      addresses.push(address)
    }
    
    return addresses
  }
  
  //todo docs
  _getAddressByHash (hash, index) {
    const tx = this.transactions.unique.find(item => item.hash === hash)
    
    if (tx) {
      return tx.out[index] ? tx.out[index].addr : null
    }
    
    return null
  }
  
  /**
   * Returns the derivation index for an address
   * @param {string} address - Legacy Bitcoin address
   */
  
  _getDeriveIndexByAddress (address) {
    let find = this.addresses.external.find(item => item.address === address)
    let node = 'external'
    
    if (!find) {
      find = this.addresses.internal.find(item => item.address === address)
      node = 'internal'
    }
    
    return {
      index: find ? find.derive_index : null,
      node: node
    }
  }
  
  /**
   * Getting information about addresses and forming an array of addresses.
   * Makes a request for a bundle of addresses and gets a list of transactions
   * @param {Object} node - Bitcoin node
   * @param {string} type - Node type (external or internal)
   * @returns {Promise<Array>} A list of addresses with transactions
   */
  
  async getAddressesByNode (node, type) {
    const CONTROL_COUNT = 100
    let list = []
    let counter = 0
    let derive_index = 0
    let empty = {
      status: false,
      data: null
    }
    let data = {
      from: 0,
      to: CONTROL_COUNT
    }
    
    const req = async () => {
      let addresses = await this._getArrayOfAddresses(
        node,
        type,
        data.from,
        data.to
      )
      
      try {
        let res = await this.getMultiAddressRequest(addresses)
        
        if (res.hasOwnProperty('txs')) {
          this.transactions.all = [...this.transactions.all, ...res.txs]
        }
        
        if (res.hasOwnProperty('unspent_outputs')) {
          this.unspent = [...this.unspent, ...res.unspent_outputs]
        }
        
        if (res.hasOwnProperty('last_block')) {
          this.latestBlock = res.last_block
        }
        
        if (res.hasOwnProperty('addresses')) {
          for (let i = data.from; i < data.to; i++) {
            if (counter >= CONTROL_COUNT) break
            
            const index = i <= CONTROL_COUNT ? i : i - CONTROL_COUNT
            let item = res.addresses.find((itm) => itm.address === addresses[index])
            
            if (item && item.n_tx) {
              counter = 0
              item.type = type
              item.derive_index = derive_index
              list.push(item)
            } else {
              counter++
              if (!empty.status) {
                item = {}
                item.type = type
                item.derive_index = derive_index
                
                if (type === 'external') {
                  item.address = getBtcAddress(this.externalNode, derive_index, this.format)
                } else {
                  item.address = getBtcAddress(this.internalNode, derive_index, this.format)
                }
                
                empty.status = true
                empty.data = item
              }
            }
            derive_index++
          }
          
          if (counter < CONTROL_COUNT) {
            data.from += CONTROL_COUNT
            data.to += CONTROL_COUNT
            await req()
          } else {
            list.push(empty.data)
          }
        } else {
          let data = {
            type: type,
            derive_index: derive_index
          }
          
          if (type === 'external') {
            data.address = getBtcAddress(this.externalNode, derive_index, this.format)
          } else {
            data.address = getBtcAddress(this.internalNode, derive_index, this.format)
          }
          
          list.push(data)
        }
      }
      catch (e) {
        console.log('BTC SyncPromise', e)
      }
    }
    
    await req()
    
    return list
  }
  
  /**
   * Processing transaction information: setting the type (incoming or outgoing),
   * getting addresses from and to, getting a transaction amount
   * @returns {Promise<Boolean>}
   */
  
  async processTransactions () {
    this.transactions.unique = this.transactions.all.filter(
      (value, index, self) =>
        self.findIndex((tx) => tx.hash === value.hash) === index
    )
    
    // ????? const externalAddresses = this.addresses.external.map(item => item.address)
    
    try {
      this.transactions.unique.forEach((tx) => {
        let isMyInAddress = false
        
        for (let input of tx.inputs) {
          if (input.prev_out?.addr) {
            if (this.addresses.all.includes(input.prev_out.addr)) {
              isMyInAddress = true
              break
            }
          }
        }
        
        tx.action = isMyInAddress ? 'outgoing' : 'incoming'
        tx.self = isMyInAddress ? tx.out.every(item => this.addresses.all.includes(item.addr)) : false
        
        if (tx.self) {
          tx.action = 'outgoing'
        }
        
        tx.from = tx.inputs[0].prev_out.addr
        
        if (tx.action === 'incoming') {
          let to = tx.out.find(item => {
            return this.addresses.all.includes(item.addr)
          })
          if (to) {
            tx.to = to.addr
            tx.value = to.value
          } else {
            tx.to = tx.out[0].addr
            tx.value = tx.out[0].value
          }
        } else {
          tx.to = tx.out[0].addr
          tx.value = tx.out[0].value
        }
      })
    }
    catch (e) {
      console.log('BTC processTransactions', e)
    }
  }
  
  //todo: docs
  
  async getTxInfoForUnspent () {
    if (!this.unspent.length) return
    const unspent = []
    
    for (let item of this.unspent) {
      const address = this._getAddressByHash(item.tx_hash_big_endian, item.tx_output_n)
      //todo error
      if (!address) continue
      
      item.address = address
      
      const derivationInfo = this._getDeriveIndexByAddress(item.address)
      
      if (derivationInfo.index === null) continue
      
      item.derive_index = derivationInfo.index
      item.node_type = derivationInfo.node
      unspent.push(item)
    }
    
    this.unspent = unspent
  }
  
  /**
   * Getting a balance of Bitcoin wallet from a list of unspent
   * @param {Array} unspent - The list of unspent transaction output
   * @returns {number} The balance of the Bitcoin Cash wallet
   */
  
  getBalance (unspent) {
    if (!Array.isArray(unspent)) {
      return 0
    }
    
    let balance = 0
    
    unspent.forEach((item) => {
      if (item && item.hasOwnProperty('value')) {
        balance += +item.value
      }
    })
    
    this.balance = balance
  }
  
  // /**
  //  * Getting a raw transaction from the transaction hash
  //  * @param {string} txHash - Transaction hash
  //  * @returns {Promise<Object>} - Raw transaction
  //  */
  //
  // async getRawTxRequest (txHash) {
  //   let params = {
  //     method: 'rawtx',
  //     tx_hash: txHash
  //   }
  //
  //   try {
  //     let res = await this.request.send(params)
  //
  //     if (res.status === 'success') {
  //       return res.data
  //     } else {
  //       console.log(res.error)
  //       return {}
  //     }
  //   }
  //   catch (e) {
  //     console.log('BTC getLatestBlock', e)
  //   }
  // }
  
  /**
   * Request for information at multiple addresses
   * @param {Array} addresses - List of addresses to get data from
   * @returns {Promise<Object>} Address information, including a list of transactions
   */
  
  async getMultiAddressRequest (addresses) {
    if (!addresses) return false
    
    const OFFSET_STEP = 100
    const TXS_COUNT = 100
    let offset = 0
    let data = {}
    let txs = []
    
    const req = async () => {
      let params = {
        method: 'multiaddr',
        active: addresses,
        n: TXS_COUNT,
        offset: offset
      }
      
      try {
        let res = await this.request.send(params)
        
        if (res.status === 'success') {
          data = res.data || {}
          
          if (res.data.hasOwnProperty('txs')) {
            txs = [...txs, ...res.data.txs]
            if (res.data.txs.length === TXS_COUNT) {
              offset += OFFSET_STEP
              await req()
            }
          }
          
          data.txs = txs
        } else {
          console.log('BTC getMultiAddressRequest', res.error)
        }
      }
      catch (err) {
        console.log('BTC getMultiAddressRequest', err)
      }
    }
    
    await req()
    
    return data
  }
  
  /**
   * Request to receive a recommended set of bitcoin fees
   * @returns {Promise<Array>} Set of bitcoin fees
   */
  
  async getFeesRequest () {
    try {
      const res = await fetch(this.api.bitcoinFee)
      const resJson = await res.json()
      this.fee = resJson.sort((a, b) => b.feePerByte - a.feePerByte)
    }
    catch (err) {
      console.log('BTC getFeesRequest', err)
    }
  }
  
  /**
   * Full information about the bitcoin wallet
   * @returns {Object}
   * @constructor
   */
  
  get DATA () {
    return {
      addresses: this.addresses,
      transactions: this.transactions,
      unspent: this.unspent,
      balance: this.balance,
      latestBlock: this.latestBlock,
      fee: this.fee
    }
  }
}
