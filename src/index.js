import * as core from '@/services/core' // TODO: wallet core?
import * as sync from '@/services/sync'
import * as coinsCores from '@/services/cores'
import * as tx from '@/services/tx'
import * as helpers from '@/helpers/coreHelper'
import * as configUtils from '@/utils/config-utils'
import * as web3Utils from 'web3-utils'
import * as addressUtils from '@/utils/address-utils'
import * as utils from '@/services/utils'

export {default as mnemonicChecker} from '@/libs/bip39-checker'
export {default as converter} from '@/helpers/converters'
export {default as toDecimal} from '@/helpers/toFormatDecimal'
export {
  core,
  coinsCores,
  sync,
  tx,
  helpers,
  configUtils,
  web3Utils,
  addressUtils,
  utils
}

console.log('link core 4')
