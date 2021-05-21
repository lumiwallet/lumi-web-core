export default class BinanceTx {
  constructor (data) {
    data = data || {}
    if (!data.chain_id) {
      throw new Error("chain id should not be null")
    }
    
    this.chain_id = data.chain_id
    this.address = data.address
    this.account_number = data.account_number || 0
    this.memo = data.memo || ''
    //this.msgs = data.msgs
    this.sequence = data.sequence
    this.source = data.source || 0
    this.fee = data.fee
    this.signatures = []
  }
  
  make () {
    let inputs = [
      {
        'coins': [
          {
            'denom': 'BNB',
            'amount': '200000000'
          }
        ],
        'address': 'bnc1hgm0p7khfk85zpz5v0j8wnej3a90w7098fpxyh'
      }
    ]
    
    let outputs = [
      {
        'address': 'bnc1cku54wwn66w2rkgs3h6v5zxrwtzyew8chcl720',
        'coins': [
          {
            'denom': 'BNB',
            'amount': '200000000'
          }
        ]
      }
    ]
    let tx_template = {
      'sequence': this.sequence,
      'account_number': this.account_number,
      'data': null,
      'chain_id': 'chain-bnb',
      'memo': this.memo,
      'source': this.source,
      'msgs': [
        {
          inputs,
          outputs
        }
      ]
    }
    
    console.log('tx_template', tx_template)
  }
}
