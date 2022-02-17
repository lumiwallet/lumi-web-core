import Request         from '@/logic/helpers/Request'
import {convertToUnit} from './helpers'

const BASE_UNIT = 'lovelace'

export class AdaSync {
  constructor(data) {
    if (!data.api) {
      throw new Error('Not enough data to create the class AdaSync')
    }
    this.balance = 0
    this.tokensBalance = {}
    this.transactions = []
    this.tokensTransactions = []
    this.unspent = []
    this.core = null
    this.derivedAddresses = {
      0: [],
      1: []
    }
    this.addresses = {
      change: [],
      external: [],
      empty: {
        0: null,
        1: null
      },
      all: []
    }
    this.assets = []
    this.latestBlock = {}
    this.api = data.api
    this.fees = []
    this.request = new Request(this.api, {}, data.headers)
  }
  
  set CORE(core) {
    this.core = core
  }
  
  async startSync() {
    this.transactions = []
    this.tokensTransactions = []
    this.addresses.external = []
    this.addresses.change = []
    await Promise.all([
      await this.getAddressesAndTx(0),
      await this.getAddressesAndTx(1),
      await this.getLatestBlockRequest()
    ])
    this.addresses.all = [...this.addresses.external, ...this.addresses.change]
    await this.getUtxo()
    this.processUtxos()
    this.processTxs()
  }
  
  async getAddresses(from, to, type) { // 0 - external, 1 - internal (change)
    let addresses = []
    
    for (let i = from; i < to; i++) {
      let address
      
      if (this.derivedAddresses[type].hasOwnProperty(i)) {
        address = this.derivedAddresses[type][i]
      } else {
        address = await this.core.getAddress(type, i)
        this.derivedAddresses[type][i] = address
      }
      addresses.push(address)
    }
    
    return addresses
  }
  
  async getAddressesAndTx(type = 0) {
    let from = 0
    let to = 40
    const OFFSET_STEP = 40
    const COUNT_EMPTY = 5
    
    const req = async () => {
      try {
        let addresses = await this.getAddresses(from, to, type)
        const txs = await this.getTxRequest(addresses)
        this.transactions = [...txs, ...this.transactions]
        
        let {
          countEmptyAddrs,
          firstEmptyAddress
        } = this.checkTxs(txs, addresses, type)
        
        if (!this.addresses.empty[type]) {
          this.addresses.empty[type] = firstEmptyAddress
        }
        
        if (countEmptyAddrs < COUNT_EMPTY) {
          from += OFFSET_STEP
          to += OFFSET_STEP
          await req()
        }
      }
      catch (e) {
        console.log('ADA getTxs error', e.message)
      }
    }
    
    await req()
  }
  
  checkTxs(txs, addresses, type) {
    let counter = 0
    let firstEmptyAddress = null
    
    for (let addr of addresses) {
      let find = txs.find(tx => tx.addr === addr)
      
      if (find) {
        counter = 0
        switch (type) {
          case 0:
            this.addresses.external.push(addr)
            break
          case 1:
            this.addresses.change.push(addr)
            break
        }
      } else {
        counter += 1
        if (!firstEmptyAddress) {
          firstEmptyAddress = addr
        }
      }
      if (counter >= 5) {
        break
      }
    }
    
    return {
      countEmptyAddrs: counter,
      firstEmptyAddress
    }
  }
  
  processTxs() {
    let uniqTxs = this.transactions.filter((value, index, self) => {
      return self.findIndex(v => v.hash === value.hash) === index
    })
    let tokensTxs = {}
    
    for (let i = uniqTxs.length - 1; i >= 0; i--) {
      let tx = uniqTxs[i]
      let {inputs, outputs} = tx
      let tokenTx = null
      let ownOutputs = outputs.every(item => this.addresses.all.includes(item.address))
      let ownInputs = inputs.filter(item => this.addresses.all.includes(item.address))
  
      if (ownOutputs && ownInputs.length) {
        const collateral = ownInputs.find(item => item.collateral)
        if (collateral) {
          tx.collateral = true
        } else {
          tx.self = true
        }
      }
      
      if (ownInputs.length && !tx.collateral) {
        tx.action = 'outgoing'
        tx.targetOutput = outputs[0]
        tx.targetAddress = outputs[0].address
      } else {
        tx.action = 'incoming'
        tx.targetAddress = inputs[0].address
        tx.targetOutput = outputs.find(item => this.addresses.all.includes(item.address))
      }
      
      for (let item of tx.targetOutput.amount) {
        const {unit} = item
        
        if (!tokensTxs[unit]) tokensTxs[unit] = []
        tokensTxs[unit].push(tx)
        if (unit !== BASE_UNIT) tokenTx = unit
      }
      
      if (tokenTx) {
        tx.tokenTx = tokenTx
      }
    }
    
    this.transactions = uniqTxs
    this.tokensTransactions = tokensTxs
  }
  
  async getUtxo() {
    this.unspent = await this.getUtxoRequest(this.addresses.all)
    this.processUtxos()
  }
  
  processUtxos() {
    this.balance = 0
    this.tokensBalance = {}
    for (let item of this.unspent) {
      let {amount, addr} = item
      
      amount.forEach(utxo => {
        let {unit, quantity} = utxo
        if (unit === BASE_UNIT) {
          this.balance += +quantity
        } else {
          if (!this.tokensBalance[unit]) this.tokensBalance[unit] = 0
          this.tokensBalance[unit] += +quantity
        }
      })
      
      item.deriveInfo = this.getDeriveInfoForAddress(addr)
      
    }
  }
  
  getDeriveInfoForAddress(address) {
    for (let type in this.derivedAddresses) {
      for (let i in this.derivedAddresses[type]) {
        if (this.derivedAddresses[type][i] === address) {
          return {type, i}
        }
      }
    }
    
    throw new Error('Address not found')
  }
  
  async getTxRequest(addresses) {
    if (!addresses || !addresses.length) return []
    
    let params = {
      addresses: addresses,
      page: 1,
      order: 'asc',
      count: 100
    }
    
    let txs = []
    
    const req = async () => {
      try {
        const res = await this.request.send(params, 'v4/transactions')
        
        if (res.data) {
          txs = [...res.data, ...txs]
          
          if (res.data.length >= 100) {
            params.page++
            await req()
          }
        } else {
          throw new Error(res.error)
        }
      }
      catch (e) {
        console.log('ADA getTxRequest error', e.message)
      }
    }
    
    await req()
    return txs
  }
  
  async getUtxoRequest(addresses) {
    if (!addresses || !addresses.length) return []
    
    const ARRAY_SIZE = 100
    const ARRAYS_COUNT = Math.ceil(addresses.length / ARRAY_SIZE)
    let arrays = []
    let counter = 0
    
    for (let i = 0; i < ARRAYS_COUNT; i++) {
      arrays[i] = addresses.slice((i * ARRAY_SIZE), (i * ARRAY_SIZE) + ARRAY_SIZE)
    }
    
    const MAX_COUNT = 100
    let utxos = []
    
    const req = async () => {
      try {
        let params = {
          addresses: arrays[counter],
          page: 1,
          order: 'asc'
        }
        
        const res = await this.request.send(params, 'utxos')
        
        if (res.data) {
          utxos = [...res.data, ...utxos]
          
          if (res.data.length >= MAX_COUNT) {
            params.page++
            await req()
          } else {
            counter++
            params.page = 1
            if (counter !== ARRAYS_COUNT) {
              await req()
            }
          }
        } else {
          throw new Error(res.data.error)
        }
      }
      catch (e) {
        console.log('ADA getUtxoRequest error', e.message)
      }
    }
    
    await req()
    return utxos
  }
  
  async getLatestBlockRequest() {
    const res = await this.request.send({}, 'latestBlock', 'GET')
    
    if (res.data) {
      this.latestBlock = res.data
      return this.latestBlock
    } else {
      console.log('getLatestBlockRequest error', res)
    }
  }
  
  async getAssetsRequest(assets = []) {
    if (!assets.length) return
    
    const res = await this.request.send({
      assets
    }, 'assets')
    
    if (res.data) {
      this.assets = res.data
      return this.assets
    } else {
      console.log('getAssetsRequest error', res)
    }
  }
  
  async getFeeRequest() {
    if (this.fees.length) return this.fees[0]
    
    const res = await this.request.send({}, 'fee', 'GET')
    
    if (res.status === 'success') {
      res.data.forEach(item => {
        item.baseFee = Math.ceil(convertToUnit(item.baseFee))
        item.feePerByte = Math.ceil(convertToUnit(item.feePerByte))
        this.fees.push(item)
      })
      
      return this.fees[0]
    } else {
      console.log('getFeeRequest error', res.data)
    }
  }
  
  async pushTxRequest(txHex) {
    const res = await this.request.send({data: txHex}, 'pushTx')
    
    if (res.status === 'success') {
      return res.data.hash
    } else {
      throw new Error(res.error)
    }
  }
  
  get changeAddress() {
    return this.addresses.empty[1] // index of change branch
  }
  
  get DATA() {
    return {
      addresses: this.addresses,
      transactions: this.transactions,
      tokensTransactions: this.tokensTransactions,
      balance: this.balance,
      tokensBalance: this.tokensBalance,
      latestBlock: this.latestBlock
    }
  }
}
