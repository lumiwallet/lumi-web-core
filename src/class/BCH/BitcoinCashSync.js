import Request from '@/helpers/Request'
import {getBtcAddress} from '@/helpers/coreHelper'

// const BCH_PREFIX = 'bitcoincash:'

export default class BitcoinCashSync {
  constructor (externalNode, internalNode, api) {
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
    this.request = new Request(this.api.bitcoinCash)
  }
  
  async Start () {
    await Promise.all([
      await this.getAddresses(),
      await this.getBlockchainInfo()
    ])
  }
  
  async getAddresses () {
    const nodeData = [
      {
        node: this.externalNode,
        type: 'external'
      },
      {
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
    
    await this.getUnspent()
    await this.processTransactions()
  }
  
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
        
        if (!res.length) return
        
        res.forEach((addr, i) => {
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
        
        const vout = tx.vout.find(item => {
          return item.scriptPubKey.hasOwnProperty('addresses') && item.scriptPubKey.addresses.length
        })
        
        tx.to = vout.scriptPubKey.addresses[0]
        tx.from = tx.vin[0].addr
        tx.value = tx.vout[0].value
      })
    }
    catch (e) {
      console.log('BCH processTransactions error', e)
    }
  }
  
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
  
  _getDeriveIndexByAddress (address, type) {
    let finded = this.addresses.external.find(item => item.address === address)
    let node = 'external'
    
    if (!finded) {
      finded = this.addresses.internal.find(item => item.address === address)
      node = 'internal'
    }
    
    return {
      index: finded.deriveIndex,
      node: node
    }
  }
  
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
