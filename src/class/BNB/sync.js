import Request from '@/helpers/Request'

const DEFAULT_FEE = [
  {
    'name': 'Regular',
    'fee': 7500
  }
]

export default class BinanceSync {
  constructor (address, api, headers) {
    this.address = address
    this.api = api
    this.balance = 0
    this.symbol = ''
    this.sequence = 0
    this.account_number = 0
    this.transactions = []
    this.fee = []
    this.request = new Request(this.api.bnb, headers)
  }
  
  async Start () {
    await Promise.all([
      await this.getInfo(),
      await this.getTransactions(),
      await this.getFee()
    ])
  }
  
  async getInfo () {
    this.balance = 0
    
    const params = {
      address: this.address
    }
    
    let res = await this.request.send(params, 'balance')
    
    if (res && res.status === 'success') {
      this.balance = +res.data?.balances[0]?.free || 0
      this.symbol = res.data?.balances[0]?.symbol || ''
      this.account_number = res.data?.account_number || 0
      this.sequence = res.data?.sequence || 0
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
  
  async getFee () {
    let res = await this.request.send({}, 'fees', 'GET')
    
    if (res && res.data) {
      this.fee = res.data
    } else {
      this.fee = DEFAULT_FEE
    }
  }
  
  get DATA () {
    return {
      address: this.address,
      balance: this.balance,
      symbol: this.symbol,
      sequence: this.sequence,
      account_number: this.account_number,
      transactions: this.transactions,
      fee: this.fee
    }
  }
}
