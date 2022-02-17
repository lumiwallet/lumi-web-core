const DEFAULT_ERROR = 'Not enough ADA funds for fee'

const errors = [
  {
    trigger: 'FeeTooSmallUTxO',
    message: 'FeeTooSmallUTxO'
  },
  {
    trigger: 'INPUTS_EXHAUSTED',
    message: DEFAULT_ERROR
  },
  {
    trigger: 'Not enough ADA leftover',
    message: DEFAULT_ERROR
  },
  {
    trigger: 'MIN_UTXO_ERROR',
    message: DEFAULT_ERROR
  },
  {
    trigger: 'less than the minimum UTXO value',
    message: DEFAULT_ERROR
  },
  {
    trigger: 'Value 0 less than the minimum',
    message: ''
  }
]

export default function(msg) {
  let finalMsg = ''
  
  for (let item of errors) {
    if (msg.includes(item.trigger)) {
      finalMsg = item.message
      break
    }
  }
  
  return finalMsg
}
