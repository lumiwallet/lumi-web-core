import Loader from './loader'
import {mnemonicToEntropy} from '@/helpers/coreHelper'

export class AdaCore {
  constructor() {
    this.accountKey = null
    this.paymentAddr = null
    this.fee = 0
    this.network = 'mainnet'
    this.addresses = {
      external: [],
      internal: []
    }
  }

  async createCore(seedPhrase) {
    await Loader.load()
    let entropy = mnemonicToEntropy(seedPhrase)
    console.log('Loader', Loader)
    let rootKey = Loader.Cardano.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, 'hex'),
      Buffer.from('')
    )
    console.log('rootKey', rootKey)
    entropy = null
    seedPhrase = null

    this.accountKey = rootKey
      .derive(harden(1852)) // purpose
      .derive(harden(1815)) // coin type
      .derive(harden(0)) // account

    this.paymentAddr = await this.getAddress()
  }

  async getAddress(path = 0, index = 0) {
    const utxoPubKey = this.accountKey
      .derive(path) // external or internal
      .derive(index)
      .to_public()

    const stakeKey = this.accountKey
      .derive(2) // chimeric
      .derive(0)
      .to_public()

    const paymentAddr = Loader.Cardano.BaseAddress.new(
      this.network === 'mainnet'
        ? Loader.Cardano.NetworkInfo.mainnet().network_id()
        : Loader.Cardano.NetworkInfo.testnet().network_id(),
      Loader.Cardano.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
      Loader.Cardano.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
    )
      .to_address()
      .to_bech32()
    return paymentAddr
  }

  async getUtxoKey(path = 0, index = 0) {
    return this.accountKey
      .derive(path)
      .derive(index)
  }

  async getKeysByUtxos(jsonUtxos) {
    let keys = []
    for (let item of jsonUtxos) {
      let {deriveInfo} = item
      let prvKey = await this.getUtxoKey(deriveInfo.type, deriveInfo.i)
      let prvKeyHex = Buffer.from(prvKey.to_raw_key().as_bytes()).toString(
        'hex'
      )
      keys.push({
        key: prvKey.to_raw_key().as_bytes(),
        prvKeyHex,
        hash: item.tx_hash,
        txId: item.output_index
      })
    }
    return keys
  }
}

const harden = (num) => {
  return 0x80000000 + num
}
