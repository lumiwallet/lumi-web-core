import Request from '@/helpers/Request'
import {getBtcAddress, privateKeyToWIF} from '@/helpers/coreHelper'

/**
 * Class BitcoinSync.
 * This class allows you to get information about the balance on a bitcoin wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export default class BitcoinSync {
  /**
   * Create a BitcoinSync
   * @param {Object} node - External Bitcoin node
   * @param {Object} internalNode - Internal Bitcoin node
   * @param {Object} api - A set of URLs for getting information about bitcoin addresses
   */
  constructor (node, internalNode, api) {
    this.node = node
    this.internalNode = internalNode
    this.api = api
    this.balance = 0
    this.latestBlock = 0
    this.unspent = []
    this.addresses = {
      external: [],
      internal: [],
      empty: {},
      fullList: [],
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
    this.checked200 = false
    this.request = new Request(this.api.bitcoin)
  }
  
  /**
   * The method that starts the synchronization Bitcoin part of wallet
   * @returns {Promise<boolean>}
   * @constructor
   */
  
  async Start () {
    await this.getAddresses()
    await this.processTransactions()
    await this.getFeesRequest()
  }
  
  /**
   * Getting internal and external addresses that were involved in transactions
   * @returns {Promise<boolean>}
   */
  
  async getAddresses () {
    this.addresses.external = await this.getAddressesByNode(
      this.node,
      'external'
    )
    this.addresses.internal = await this.getAddressesByNode(
      this.internalNode,
      'internal'
    )
    this.addresses.empty = {
      external: this.addresses.external[this.addresses.external.length - 1],
      internal: this.addresses.internal[this.addresses.internal.length - 1]
    }

    await this.additionalCheckAddress()

    this.addresses.fullList = [
      ...this.addresses.external,
      ...this.addresses.internal
    ]
    this.addresses.all = this.addresses.fullList.map((item) => item.address)

    await this.getUnspent()
    this.balance = this.getBalance(this.unspent)
  }
  
  /**
   * Auxiliary method that gets the bitcoin address by node and index
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
        address = getBtcAddress(node, i)
      }
      addresses.push(address)
    }

    return addresses
  }
  
  /**
   * Getting information about addresses and forming an array of addresses.
   * Makes a request for a bundle of addresses and gets a list of transactions
   * @param node - Bitcoin node
   * @param type - Node type (external or internal)
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
        
        if (res.hasOwnProperty('addresses')) {
          for (let i = data.from; i < data.to; i++) {
            if (counter >= CONTROL_COUNT) break
    
            let item = res.addresses.find((itm) => itm.address === addresses[i])
    
            if (item && item.n_tx) {
              counter = 0
              empty.status = false
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
                  item.address = getBtcAddress(this.node, derive_index)
                } else {
                  item.address = getBtcAddress(this.internalNode, derive_index)
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
            data.address = getBtcAddress(this.node, derive_index)
          } else {
            data.address = getBtcAddress(this.internalNode, derive_index)
          }
          
          list.push(data)
        }
      }
      catch (e) {
        console.log('BTC SyncPromise', e)
        //TODO: error handler
      }
    }

    await req()
    
    return list
  }

  async additionalCheckAddress () {
    if (!this.checked200 && !this.deriveAddress.internal.hasOwnProperty(200)) {
      let address = getBtcAddress(this.internalNode, 200)
      this.deriveAddress.internal[200] = address
      this.checked200 = true
      
      let res = await this.getMultiAddressRequest([address])
  
      if (res.hasOwnProperty('txs')) {
        this.transactions.all = [...this.transactions.all, ...res.txs]
      }
    
      if (res.hasOwnProperty('addresses')) {
        let item = res.addresses.find((itm) => itm.address === address)

        if (item && item.n_tx) {
          item.type = 'internal'
          item.derive_index = 200

          let lastEmptyAddress = this.addresses.internal.pop()
          this.addresses.internal.push(item)
          this.addresses.internal.push(lastEmptyAddress)
        }
      }
    }
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

    try {
      this.transactions.unique.forEach((tx) => {
        let isMyOutAddress = this.addresses.all.indexOf(tx.out[0].addr) >= 0
        let isMyInAddress =
          this.addresses.all.indexOf(tx.inputs[0].prev_out.addr) >= 0

        tx.action = isMyOutAddress ? 'incoming' : 'outgoing'
        tx.self = isMyOutAddress && isMyInAddress
        tx.to = tx.out[0].addr
        tx.from = tx.inputs[0].prev_out.addr
        tx.value = tx.out[0].value
      })
    }
    catch (e) {
      console.log('BTC processTransactions', e)
    }
  }
  
  /**
   * Getting a unspent transaction output for all addresses in the wallet with the transaction
   * @returns {Promise<boolean>}
   */

  async getUnspent () {
    let res = await this.getUnspentOutputsRequest(this.addresses.all)
    let unspentHash = []
    let unspent = []
    
    res.forEach((item) => {
      if (unspentHash.indexOf(item.tx_hash_big_endian) < 0) {
        unspentHash.push(item.tx_hash_big_endian)
      }
    })

    for (let hash of unspentHash) {
      let tx = await this.getRawTxRequest(hash)

      if (tx.hasOwnProperty('out')) {
        tx.out.forEach((item) => {
          if (
            !item.spent &&
            item.addr &&
            this.addresses.all.indexOf(item.addr) >= 0
          ) {
            item.hash = tx.hash
            item.key = this.getPrivateKey(item.addr)
            unspent.push(item)
          }
        })
      }
    }

    this.unspent = unspent.sort((a, b) => b.value - a.value)
  }
  
  /**
   * Getting a balance of Bitcoin wallet from a list of unspent
   * @param {Array} unspent - The list of unspent transaction output
   * @returns {number} The balance of the bitcoin wallet
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
    
    return balance
  }
  
  /**
   * Getting a private key at a bitcoin address
   * @param {string} address - Bitcoin address
   * @returns {Object} - Bitcoin private key
   */
  
  getPrivateKey (address) {
    let finded = this.addresses.internal.find(
      (item) => item.address === address
    )
    let key, wif = null

    if (finded) {
      key = this.internalNode.deriveChild(finded.derive_index).privateKey
      wif = privateKeyToWIF(key)
    } else {
      finded = this.addresses.external.find((item) => item.address === address)
      key = this.node.deriveChild(finded.derive_index).privateKey
      wif = privateKeyToWIF(key)
    }

    return wif
  }
  
  /**
   * Getting a raw transaction from the transaction hash
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Raw transaction
   */

  async getRawTxRequest (txHash) {
    let params = {
      method: 'rawtx',
      tx_hash: txHash
    }

    try {
      let res = await this.request.send(params)
  
      if (res.status === 'success') {
        return res.data
      } else {
        console.log(res.error)
        return {}
      }
    }
    catch (e) {
      console.log('BTC getLatestBlock', e)
    }
  }
  
  /**
   * Request for information at multiple addresses
   * @param {Array} addresses - List of addresses to get data from
   * @returns {Promise<Object>} Address information, including a list of transactions
   */

  async getMultiAddressRequest (addresses) {
    if (!addresses) return false
    
    let params = {
      method: 'multiaddr',
      active: addresses
    }

    try {
      let res = await this.request.send(params)
  
      if (res.status === 'success') {
        if (
          res.data.hasOwnProperty('info') &&
          res.data.info.hasOwnProperty('latest_block')
        ) {
          this.latestBlock = res.data.info.latest_block.height
        }
        return res.data
      } else {
        console.log(res.error)
        return {}
      }
    }
    catch (err) {
      console.log('BTC getMultiAddressRequest', err)
    }
  }
  
  /**
   * Request to receive unspent outputs
   * @param {Array} addresses - A set of addresses to get the unspent output from
   * @returns {Promise<Array>} - Information about unspent output
   */

  async getUnspentOutputsRequest (addresses) {
    if (!addresses) return []
    
    let length = 100
    let arraysCount = Math.ceil(addresses.length / length)
    let list = []
    let arrays = []
    
    for (let i = 0; i < arraysCount; i++) {
      let arr = addresses.slice(i * length, (i + 1) * length)
      arrays.push(arr)
    }
    
    return new Promise(resolve => {
      Promise.all(arrays.map((array) => {
        return new Promise ((resolve) => {
          let params = {
            method: 'unspent',
            active: array
          }
      
          this.request.send(params).then(res => {
            if (res.status === 'success') {
              list = [...res.data.unspent_outputs, ...list]
            }
            
            resolve()
          }).catch(err => {
            console.log('BTC getUnspentOutputsRequest', err)
          })
        })
      })).then(() => {
        resolve(list)
      })
    })
  }
  
  /**
   * Request to receive a recommended set of bitcoin fees
   * @returns {Promise<Array>} Set of bitcoin fees
   */

  async getFeesRequest () {
    try {
      let res = await fetch(this.api.bitcoinFee)
      this.fee = await res.json()
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
