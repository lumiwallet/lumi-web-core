import {CoinsNetwork} from '@lumiwallet/lumi-network'

const request = CoinsNetwork.ethTokens

export default class EthereumTokensSync {
  constructor(address, token, headers) {
    this.address = address
    this.token = token
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
    this.balance = await request.getBalance(this.address, this.token.contract, this.headers)

    return this.balance
  }

  async getTransactions() {
    this.transactions = []

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

    this.transactions.push(...res)
  }

  async getInTransactions() {
    let res = await request.getInTransactions(this.token.contract,this.topic0,this.otherTopics)

    this.transactions.push(...res)
  }

  get DATA () {
    return {
      balance: this.balance,
      transactions: this.transactions,
    }
  }
}
