import Request from '@/helpers/Request'

export default class BinanceSync {
  constructor (address, api, headers) {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    //this.gasPrice = 0
    this.request = new Request(this.api.bnb, headers)
  }
  
  async Start () {
    await Promise.all([
      await this.getBalance(),
      await this.getTransactions()
    ])
  }
  
  async getBalance () {
    this.balance = 0
    
    const params = {
      address: this.address
    }
    
    let res = await this.request.send(params, 'balance')
    if (res && res?.data?.balances) {
      this.balance = +res.data.balances[0]?.free
    } else {
      this.balance = 0
    }
  }
  
  async getTransactions () {
    this.transactions = []
    const startTime = 1496264400
    const endTime = Math.round(new Date().getTime() / 1000)
    const step = 100
    
    const req = async () => {
      let params = {
        address: this.address,
        startTime,
        endTime,
        offset: 0,
        limit: step
      }
  
      let res = await this.request.send(params, 'transactions')
      
      if (res && res?.data?.tx) {
        this.transactions = [...res.data.tx, ...this.transactions]
        if (res.data.tx.length < res.data.total) {
          params.offset += step
          await req()
        }
      }
    }
    
    await req()
  }
  
  get DATA () {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions
    }
  }
}
