import {CoinsNetwork}        from '@lumiwallet/lumi-network'
import {getCurrentTimestamp} from '@/helpers/timestamp'

const requests = CoinsNetwork.bnb

export default class BinanceSync {
  constructor(address, headers) {
    this.address = address
    this.balance = 0
    this.symbol = ''
    this.sequence = 0
    this.account_number = 0
    this.transactions = []
    this.fee = []
    this.headers = headers
  }

  async Start() {
    await Promise.all([
      await this.getInfo(),
      await this.getTransactions(),
      await this.getFee()
    ])
  }

  async getInfo() {
    this.balance = 0

    let res = await requests.getInfo(this.address, this.headers)

    if (res.hasOwnProperty('balances')) {
      this.balance = res.balances.length ? +res.balances[0].free || 0 : 0
      this.symbol = res.balances.length ? res.balances[0].symbol || '' : ''
      this.account_number = res.account_number || 0
      this.sequence = res.sequence || 0
    }
  }

  async getTransactions() {
    this.transactions = []
    const endTime = getCurrentTimestamp()
    const startTime = endTime - (60 * 60 * 24 * 7)
    const step = 50

    const req = async () => {
      let addParams = {
        address: this.address,
        startTime,
        endTime,
        offset: 0,
        limit: step
      }

      let res = await requests.getTxInfo(addParams, this.headers)

      if (res && res?.txs) {
        this.transactions = [...res.txs, ...this.transactions]
        if (res.txs.length < res.total) {
          addParams.offset += step
          await req()
        }
      }
    }

    await req()
  }

  async getFee() {
    try {
      this.fee = await requests.getFees(this.headers)
    }
    catch (err) {
      console.log('BNB getFeesRequest', err)
    }
  }

  get DATA() {
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
