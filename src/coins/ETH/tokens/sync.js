import {CoinsNetwork} from '@lumiwallet/lumi-network'

const request = CoinsNetwork.ethTokens

export default class EthereumTokensSync {
  constructor(address, token, api, headers) {
    this.address = address
    this.token = token
    this.api = api
    this.balance = 0
    this.transactions = []
    this.headers = headers
    this.topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    this.otherTopics = '0x000000000000000000000000' + this.address.replace('0x', '')
  }

  async Start() {
    await Promise.all([
      this.getBalance(),
      this.getTransactions()
    ])
  }

  async getBalance() {
    let res = await request.getBalance(this.address, this.token.contract, this.headers)
    this.balance = res && res.result ? res.result : 0

    return this.balance
  }

  async getTransactions() {
    await Promise.all([
      this.getOutTransactions(),
      this.getInTransactions()
    ])
    this.transactions = this.transactions.filter((item, index, self) => {
      return index === self.findIndex((i) => i.transactionHash === item.transactionHash)
    })
  }

  async getOutTransactions() {
    let res = await request.getOutTransactions(this.token.contract, this.topic0, this.otherTopics, this.headers)

    if (res && res.result) {
      this.transactions.push(...res.result)
    }
  }

  async getInTransactions() {
    let res = await request.getInTransactions(this.token.contract,this.topic0,this.otherTopics)

    if (res && res.result) {
      this.transactions.push(...res.result)
    }
  }

  get DATA () {
    return {
      balance: this.balance,
      transactions: this.transactions,
    }
  }
}
