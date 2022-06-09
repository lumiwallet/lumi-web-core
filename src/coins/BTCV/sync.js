import {hdFromXprv} from '@/helpers/core'
import {getBtcAddressByPublicKey} from '@/coins/BTC/utils'
import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.btcv

/**
 * Class BitcoinVaultSync.
 * This class allows you to get information about the balance on a Bitcoin Vault wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export default class BitcoinVaultSync {
  /**
   * Create a BitcoinVaultSync
   * @param {string} externalNodeKey - External Bitcoin Vault node
   * @param {string} internalNodeKey - Internal Bitcoin Vault node
   * @param {Object} addresses - Internal and external Bitcoin Vault addresses
   * @param {Object} api - A set of URLs for getting information about Bitcoin Vault addresses
   * @param {Object} headers - Request headers
   */
  constructor (externalNodeKey, internalNodeKey, addresses, api, headers) {
    const {external, internal} = addresses
    this.externalNode = hdFromXprv(externalNodeKey)
    this.internalNode = hdFromXprv(internalNodeKey)
    this.api = api
    this.balance = 0
    this.latestBlock = 0
    this.unspent = []
    this.defaultAddresses = {
      external, internal
    }
    this.addresses = {
      external: [],
      internal: [],
      empty: {},
      list: {}
    }
    this.transactions = {
      all: [],
      unique: []
    }
    this.fee = [
      {
        feePerByte: 3,
        name: 'Regular'
      }
    ]
    this.headers = headers
  }

  restore(data = {}) {
    restoreClass(this, data)
  }

  /**
   * The method that starts the synchronization Bitcoin Vault part of wallet
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
      await this.getHistory(),
      await this.getFeesRequest()
    ])
  }

  /**
   * Getting internal and external addresses that were involved in transactions
   * @returns {Promise<boolean>}
   */

  async getAddresses () {
    if (this.defaultAddresses.external && this.defaultAddresses.internal) {
      this.addresses.external = [
        {
          address: this.defaultAddresses.external,
          type: 'external',
          deriveIndex: 0,
          pubkey: this.externalNode.deriveChild(0).publicKey.toString('hex')
        }
      ]
      this.addresses.internal = [
        {
          address: this.defaultAddresses.internal,
          type: 'internal',
          deriveIndex: 0,
          pubkey: this.internalNode.deriveChild(0).publicKey.toString('hex')
        }
      ]
    }
    this.addresses.empty = {
      external: this.addresses.external[this.addresses.external.length - 1],
      internal: this.addresses.internal[this.addresses.internal.length - 1]
    }
    this.addresses.list = {
      external: this.addresses.external.map((item) => item.address),
      internal: this.addresses.internal.map((item) => item.address),
    }
    this.addresses.list.all = [...this.addresses.list.external, ...this.addresses.list.internal]

    await this.getUnspent()
  }

  /**
   * Returns the derivation index for an address
   * @param {string} address - Bitcoin Vault address
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

  async getHistory () {
    let history = await this.getHistoryRequest(this.addresses.list.all)

    for (let item of history) {
      let {txs} = item

      if (txs.length) {
        let formatted_txs = txs.map(tx => {
          return {
            ...tx.rawData,
            height: tx.height
          }
        })

        this.transactions.all.push(...formatted_txs)
      }
    }

    await this.processTransactions()
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
    const pubkeys = [this.addresses.external[0].pubkey, this.addresses.internal[0].pubkey]

    try {
      this.transactions.unique.forEach((tx) => {
        let vin = {
          my: [],
          other: []
        }
        let isMyInAddress
        try {
          for (let item of tx.vin) {
            if (item.txinwitness && item.txinwitness[1]) {
              let find = pubkeys.find(key => key === item.txinwitness[1])
              item.address = getBtcAddressByPublicKey(item.txinwitness[1], 'p2wpkh', 'btcv')

              if (find) {
                vin.my.push(item.address)
                isMyInAddress = true
              } else {
                vin.other.push(item.address)
              }
            }
          }
        } catch (e) {
          console.log(e)
        }
        tx.action = isMyInAddress ? 'outgoing' : 'incoming'

        // tx.self = isMyInAddress ? tx.vout.every(item => this.addresses.list.all.includes(item.scriptPubKey.addresses[0])) : false
        //
        // if (tx.self) {
        //   tx.action = 'outgoing'
        // }

        let value = 0
        if (tx.action === 'outgoing') {
          tx.vout.forEach(item => {
            item.scriptPubKey.addresses.forEach(address => {
              if (!this.addresses.list.internal.includes(address)) {
                value += item.value
                tx.to = address
              }
            })
          })
          tx.value = value
          tx.from = vin.my[0]
        } else {
          tx.vout.forEach(item => {
            item.scriptPubKey.addresses.forEach(address => {
              if (this.addresses.list.all.includes(address)) {
                value += item.value
                tx.to = address
              }
            })
          })
          tx.value = value
          tx.from = vin.other[0]
        }
      })
    }
    catch (e) {
      console.log('BTCV processTransactions error', e)
    }
  }

  /**
   * Getting a unspent transaction output for
   * all addresses in the wallet with the transaction.
   * Calculates the balance of the wallet for unspent
   * @returns {Promise<boolean>}
   */

  async getUnspent () {
    let res = await this.getUnspentOutputsRequest(this.addresses.list.all)

    res.forEach(item => {
      let {address, unspent} = item

      if (unspent.length) {
        let derivationInfo = this._getDeriveIndexByAddress(address)
        this.unspent = unspent.map(utxo => {
          utxo.address = address
          utxo.deriveIndex = derivationInfo.index
          utxo.nodeType = derivationInfo.node
          return utxo
        })
      }
    })
    this.unspent = this.unspent.sort((a, b) => b.value - a.value)
    this.balance = this.getBalance(this.unspent)
  }

  /**
   * Getting a balance of Bitcoin Vault wallet from a list of unspent
   * @param {Array} unspent - The list of unspent transaction output
   * @returns {number} The balance of the Bitcoin Vault wallet
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
   * Getting a history of Bitcoin Vault wallet from a list of addresses
   * @param {Array} addresses - The list of external and internal addresses
   * @returns {Promise<Array>} The list of transactions
   */

  async getHistoryRequest (addresses) {
    if (!addresses) return []


    try {
      let res = await requests.getHistoryRequest(addresses, this.headers)

      if (res.hasOwnProperty('lastBlock')) {
        this.latestBlock = res.lastBlock || 0
        return res.txs
      } else {
        throw new Error(res.error)
      }
    }
    catch (e) {
      console.log('BTCV getAddressTransactions error', e)
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

    const res = await requests.getUnspent(arrays, this.headers)

    return [].concat.apply([], res)
  }

  /**
   * Request to receive a recommended set of bitcoin fees
   * @returns {Promise<Array>} Set of Bitcoin Vault fees
   */

  async getFeesRequest () {
    try {
      this.fee = await requests.getFees(this.headers)
    } catch (err) {
      console.log('BTCV getFeesRequest', err)
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
