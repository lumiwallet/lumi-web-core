import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.bnb

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
    this.headers = headers
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

    let res = await requests.getInfo(this.address, this.headers)

    if (res.hasOwnProperty('balances')) {
      this.balance = +res.balances[0].free || 0
      this.symbol = res.balances[0].symbol || ''
      this.account_number = res.account_number || 0
      this.sequence = res.sequence || 0
    }
  }

  async getTransactions () {
    this.transactions = []
    const startTime = 1496264400
    const endTime = Math.round(new Date().getTime() / 1000)
    const step = 100

    const req = async () => {
      let addParams = {
        address: this.address,
        startTime,
        endTime,
        offset: 0,
        limit: step
      }

      let res = await requests.getTxInfo(addParams, this.headers)

      if (res && res?.tx) {
        this.transactions = [...res.tx, ...this.transactions]
        if (res.tx.length < res.total) {
          addParams.offset += step
          await req()
        }
      }
    }

    await req()
  }

  async getFee () {
    try {
      this.fee = await requests.getFees(this.headers)
    }
    catch (err) {
      console.log('BNB getFeesRequest', err)
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
