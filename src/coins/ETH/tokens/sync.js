import Request from '@/helpers/Request'

export default class EthereumTokensSync {
  constructor(address, token, api, headers) {
    this.address = address
    this.token = token
    this.api = api
    this.balance = 0
    this.transactions = []
    this.request = new Request(this.api, headers)
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
    let params = {
      module: 'account',
      action: 'tokenbalance',
      tag: 'latest',
      address: this.address,
      contractaddress: this.token.contract
    }

    let res = await this.request.send(params)
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
    let params = {
      module: 'logs',
      action: 'getLogs',
      fromBlock: 0,
      toBlock: 'latest',
      address: this.token.contract,
      topic0: this.topic0,
      topic1: this.otherTopics
    }

    let res = await this.request.send(params)

    if (res && res.result) {
      this.transactions.push(...res.result)
    }
  }

  async getInTransactions() {
    let params = {
      module: 'logs',
      action: 'getLogs',
      fromBlock: 0,
      toBlock: 'latest',
      address: this.token.contract,
      topic0: this.topic0,
      topic2: this.otherTopics
    }

    let res = await this.request.send(params)

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
