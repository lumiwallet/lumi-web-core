import Request from '@/helpers/Request'
import {getBtcAddress} from '@/helpers/coreHelper'

/**
 * Class BitcoinCashSync.
 * This class allows you to get information about the balance on a Bitcoin Cash wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export default class BitcoinCashSync {
  /**
   * Create a BitcoinCashSync
   * @param {Object} externalNode - External Bitcoin Cash node
   * @param {Object} internalNode - Internal Bitcoin Cash node
   * @param {Object} api - A set of URLs for getting information about Bitcoin Cash addresses
   * @param {Object} headers - Request headers
   */
  constructor (externalNode, internalNode, api, headers) {
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
    this.fee = [
      {
        feePerByte: 3,
        level: 'Regular'
      }
    ]
    
    this.request = new Request(this.api.bch, headers)
  }
  
  /**
   * The method that starts the synchronization Bitcoin Cash part of wallet
   * @returns {Promise<boolean>}
   * @constructor
   */
  
  async Start () {
    await Promise.all([
      await this.getAddresses(),
      await this.getBlockchainInfo()
    ])
  }
  
  /**
   * Getting internal and external addresses that were involved in transactions
   * @returns {Promise<boolean>}
   */
  
  async getAddresses () {
    this.addresses.external = await this.getAddressesByNode(this.externalNode, 'external')
    this.addresses.internal = await this.getAddressesByNode(this.internalNode, 'internal')
    this.addresses.empty = {
      external: this.addresses.external[this.addresses.external.length - 1],
      internal: this.addresses.internal[this.addresses.internal.length - 1]
    }
    
    this.addresses.all = [...this.addresses.external, ...this.addresses.internal].map((item) => item.address)
    await this.getUnspent()
    await this.processTransactions()
  }
  
  /**
   * Auxiliary method that gets the Bitcoin Cash address by node and index
   * @param {Object} node - Bitcoin Cash node
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
        address = getBtcAddress(node, i, 'p2pkh')
      }
      addresses.push(address)
    }
    
    return addresses
  }
  
  /**
   * Returns the derivation index for an address
   * @param {string} address - Legacy Bitcoin Cash address
   */
  
  _getDeriveIndexByAddress (address) {
    let find = this.addresses.external.find(item => item.address === address)
    let node = 'external'
    
    if (!find) {
      find = this.addresses.internal.find(item => item.address === address)
      node = 'internal'
    }
    
    return {
      index: find.deriveIndex,
      node: node
    }
  }
  
  /**
   * Getting information about addresses and forming an array of addresses.
   * Makes a request for a bundle of addresses and gets a list of transactions
   * @param node - Bitcoin Cash node
   * @param type - Node type (external or internal)
   * @returns {Promise<Array>} A list of addresses with transactions
   */
  
  async getAddressesByNode (node, type) {
    const CONTROL_COUNT = 20
    let list = []
    let counter = 0
    let deriveIndex = 0
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

        if (!Array.isArray(res) || res.error) {
          let item = {
            type,
            deriveIndex,
            address: addresses[0],
            legacyAddress: addresses[0]
          }

          list.push(item)
          return
        }

        res.forEach((addr) => {
          let item = {}
          
          if (addr.txs.length) {
            this.transactions.all = [...addr.txs, ...this.transactions.all]
            
            item.type = type
            item.deriveIndex = deriveIndex
            item.address = addr.legacyAddress
            
            list.push(item)
          } else {
            counter++
            if (!empty.status) {
              empty.status = true
              empty.data = {
                type: type,
                address: addr.legacyAddress,
                legacyAddress: addr.legacyAddress,
                cashAddress: addr.cashAddress,
                deriveIndex: deriveIndex
              }
            }
          }
          deriveIndex++
        })
        
        if (counter < CONTROL_COUNT) {
          data.from += CONTROL_COUNT
          data.to += CONTROL_COUNT
          await req()
        } else {
          list.push(empty.data)
        }
      }
      catch (e) {
        console.log('BCH getAddressesByNode error', e)
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
        self.findIndex((tx) => tx.txid === value.txid) === index
    )
    
    try {
      this.transactions.unique.forEach((tx) => {
        let isMyInAddress = this.addresses.all.some((address) => {
          return tx.vin.map(item => item.addr).includes(address)
        })
        
        tx.action = isMyInAddress ? 'outgoing' : 'incoming'
        tx.self = isMyInAddress ? tx.vout.every(item => this.addresses.all.includes(item.addr)) : false
        
        if (tx.self) {
          tx.action = 'outgoing'
        }
        
        let vout
        
        if (tx.action === 'incoming') {
          vout = tx.vout.find(item => {
            return item.scriptPubKey.hasOwnProperty('addresses') &&
              item.scriptPubKey.addresses.length &&
              this.addresses.all.includes(item.scriptPubKey.addresses[0])
          })
        }
        
        if (tx.action === 'outgoing' || !vout) {
          vout = tx.vout.find(item => {
            return item.scriptPubKey.hasOwnProperty('addresses') &&
              item.scriptPubKey.addresses.length
          })
        }
        
        
        tx.to = vout.scriptPubKey.addresses[0]
        tx.from = tx.vin[0].addr
        tx.value = vout.value
      })
    }
    catch (e) {
      console.log('BCH processTransactions error', e)
    }
  }
  
  /**
   * Getting a unspent transaction output for
   * all addresses in the wallet with the transaction.
   * Calculates the balance of the wallet for unspent
   * @returns {Promise<boolean>}
   */
  
  async getUnspent () {
    let res = await this.getUnspentOutputsRequest(this.addresses.all)
    let unspent = []
    
    res.forEach(item => {
      if (!item.utxos || !item.utxos.length) return
      
      let utxos = item.utxos.filter(utxo => utxo.satoshis)
        .map(utxo => {
          const {cashAddress, legacyAddress, scriptPubKey} = item
          const derivationInfo = this._getDeriveIndexByAddress(legacyAddress)

          return {
            ...utxo,
            cashAddress,
            legacyAddress,
            scriptPubKey,
            deriveIndex: derivationInfo.index,
            nodeType: derivationInfo.node
          }
        })
      
      unspent = [...utxos, ...unspent]
    })

    this.unspent = unspent.sort((a, b) => b.value - a.value)
    this.balance = this.getBalance(this.unspent)
  }
  
  /**
   * Getting a balance of Bitcoin Cash wallet from a list of unspent
   * @param {Array} unspent - The list of unspent transaction output
   * @returns {number} The balance of the Bitcoin Cash wallet
   */
  
  getBalance (unspent) {
    if (!Array.isArray(unspent)) {
      return 0
    }
    
    let balance = 0
    
    unspent.forEach((item) => {
      if (item && item.hasOwnProperty('satoshis')) {
        balance += +item.satoshis
      }
    })
    
    return balance
  }
  
  /**
   * Request for information at multiple addresses
   * @param {Array} addresses - List of addresses to get data from
   * @returns {Promise<Object>} Address information, including a list of transactions
   */
  
  async getMultiAddressRequest (addresses) {
    if (!addresses) return false
    
    const params = {
      method: 'addressTransactions',
      params: {
        addresses: addresses
      }
    }
    
    try {
      let res = await this.request.send(params)
      
      if (!res.hasOwnProperty('error')) {
        return res
      } else {
        throw new Error(res.error)
      }
    }
    catch (e) {
      console.log('BCH getAddressTransactions error', e)
      return []
    }
  }
  
  /**
   * Request to receive unspent outputs
   * @param {Array} addresses - A set of addresses to get the unspent output from
   * @returns {Promise<Array>} - Information about unspent output
   */
  
  async getUnspentOutputsRequest (addresses) {
    if (!addresses) return []
    
    const length = 20
    let arraysCount = Math.ceil(addresses.length / length)
    let arrays = []
    
    for (let i = 0; i < arraysCount; i++) {
      let arr = addresses.slice(i * length, (i + 1) * length)
      arrays.push(arr)
    }
    
    const res = await Promise.all(arrays.map((array) => {
      return new Promise((resolve) => {
        const params = {
          method: 'addressUtxo',
          params: {
            addresses: array
          }
        }
        
        this.request.send(params).then(res => {
          if (!res.hasOwnProperty('error')) {
            return resolve(res)
          } else {
            throw new Error(res.error)
          }
        }).catch(e => {
          console.log('BCH getUnspentOutputsRequest error', e)
          resolve([])
        })
      })
    }))
    
    return [].concat.apply([], res)
  }
  
  /**
   * Bitcoin Cash blockchain information request.
   * Getting the latest block number.
   * @returns {Promise<boolean>}
   */
  
  
  async getBlockchainInfo () {
    const params = {
      method: 'blockchainInfo',
      params: {}
    }
    
    try {
      const res = await this.request.send(params)
      
      if (!res.hasOwnProperty('error')) {
        this.latestBlock = res.blocks || 0
      } else {
        throw new Error(res.error)
      }
    }
    catch (e) {
      console.log('BCH getBlockchainInfo error', e)
    }
  }
  
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
