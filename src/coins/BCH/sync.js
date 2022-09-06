import {getCashAddress} from './utils'
import {hdFromXprv} from '@/helpers/core'
import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.bch

/**
 * Class BitcoinCashSync.
 * This class allows you to get information about the balance on a Bitcoin Cash wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export default class BitcoinCashSync {
  /**
   * Create a BitcoinCashSync
   * @param {string} externalNodeKey - External Bitcoin Cash node
   * @param {string} internalNodeKey - Internal Bitcoin Cash node
   * @param {Object} headers - Request headers
   */
  constructor (externalNodeKey, internalNodeKey, headers) {
    this.externalNode = hdFromXprv(externalNodeKey)
    this.internalNode = hdFromXprv(internalNodeKey)
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
    this.headers = headers
  }

  restore(data = {}) {
    restoreClass(this, data)
  }

  /**
   * The method that starts the synchronization Bitcoin Cash part of wallet
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
    this.getBalance()
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
    await this.processTransactions()
    await this.getTxInfoForUnspent()
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
        address = getCashAddress(node, i)
        this.deriveAddress[type][i] = address
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
      index: find ? find.derive_index : null,
      node
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
        let res = await requests.getAddressInfo(addresses, this.headers)

        if (res.hasOwnProperty('utxo')) {
          this.unspent = [...this.unspent, ...res.utxo]
        }

        if (res.hasOwnProperty('lastblock')) {
          this.latestBlock = res.lastblock
        }

        if (res.hasOwnProperty('transactions') && res.transactions.length) {
          this.transactions.all = [...this.transactions.all, ...res.transactions]

          for (let i = data.from; i < data.to; i++) {
            if (counter >= CONTROL_COUNT) break
            const index = i < CONTROL_COUNT ? i : i - CONTROL_COUNT
            let address = addresses[index]
            let find = res.transactions.find((itm) => itm.address === address)
            let item = {
              type,
              derive_index,
              address
            }

            if (find) {
              counter = 0
              list.push(item)
            } else {
              counter++
              if (!empty.status) {
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
          if (!empty.status) {
            let item = {
              type,
              derive_index
            }

            if (type === 'external') {
              item.address = getCashAddress(this.externalNode, derive_index)
            } else {
              item.address = getCashAddress(this.internalNode, derive_index)
            }
            empty.status = true
            empty.data = item
          }

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
   * getting balance, hash, time and block id
   */

  async processTransactions () {
    const hashes = this.transactions.all.map(item => item.hash)
    const unique_hashes = [...new Set(hashes)]

    for (let hash of unique_hashes) {
      const group = this.transactions.all.filter(item => item.hash === hash)
      const balance_change = group.reduce((a, b) => ({balance_change: a.balance_change + b.balance_change})).balance_change

      let tx = {
        hash,
        balance_change,
        block_id: group[0].block_id,
        time: group[0].time,
        action: balance_change > 0 ? 'incoming' : 'outgoing'
      }

      this.transactions.unique.push(tx)
    }
  }

  /**
   * Gets information necessary to create a Bitcoin transaction
   */

  async getTxInfoForUnspent () {
    if (!this.unspent.length) return
    const unspent = []

    for (let item of this.unspent) {
      if (!item.address) {
        console.log('Can\'t find the unspent address')
        continue
      }

      const derivationInfo = this._getDeriveIndexByAddress(item.address)

      if (derivationInfo.index === null) continue

      item.derive_index = derivationInfo.index
      item.node_type = derivationInfo.node
      unspent.push(item)
    }

    this.unspent = unspent
  }

  /**
   * Getting a balance of Bitcoin Cash wallet from a list of unspent
   */

  getBalance () {
    let balance = 0

    this.unspent.forEach((item) => {
      if (item && item.hasOwnProperty('value')) {
        balance += +item.value
      }
    })

    this.balance = balance
  }

  /**
   * Request to receive a recommended set of bitcoin cash fees
   * @returns {Promise<Array>} Set of Bitcoin Cash fees
   */

  async getFeesRequest () {
    try {
      this.fee = await requests.getFees(this.headers)
    } catch (err) {
      console.log('BCH getFeesRequest', err)
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
