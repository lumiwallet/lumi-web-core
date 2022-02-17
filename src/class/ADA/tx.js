import Loader            from './loader'
import {convertFromUnit} from './helpers'
import CoinSelection     from '@/logic/coins/ADA/coinSelection'

export class AdaTx {
  constructor(baseFee = '155381', feePerByte = '44', slot = 0) {
    this.utxos = []
    this.baseFee = baseFee || 0
    this.feePerByte = feePerByte || 0
    this.minUtxoValue = '1000000'
    this.maxTxSize = '16384'
    this.maxValSize = '5000'
    this.poolDeposit = '500000000'
    this.keyDeposit = '2000000'
    this.priceMem = 5.77e-2
    this.priceStep = 7.21e-5
    this.slot = slot
  }
  
  async calcFee(txBody) {
    const witnesses = Loader.Cardano.TransactionWitnessSet.new()
    const transaction = Loader.Cardano.Transaction.new(
      txBody,
      witnesses,
      undefined
    )
    
    // let size = transaction.body().to_bytes().length * 2
    let fee = transaction.body().fee().to_str()
    
    return [
      {
        unit: fee,
        fee: convertFromUnit(+fee),
        name: 'Optimal',
        id: 'optimal'
      }
    ]
  }
  
  async calcMinAda(assets, outputAddress) {
    const output = {
      address: outputAddress,
      amount: [
        {
          unit: 'lovelace',
          quantity: this.minUtxoValue
        }
      ]
    }
    assets.forEach(item => {
      output.amount.push({
        unit: item.contract,
        quantity: item.amount.toString()
      })
    })
    const outputValue = await assetsToValue(output.amount)
    const minAda = await minAdaRequired(
      outputValue,
      Loader.Cardano.BigNum.from_str(this.minUtxoValue)
    )
    
    return convertFromUnit(minAda)
  }
  
  async createTxBody({
    utxos = [],
    outputAddress = '',
    changeAddress = '',
    amount = '',
    fee = 0,
    token = null,
    sendAll = false,
    rebuild = false
  }) {
    await Loader.load()
    
    const txBuilder = Loader.Cardano.TransactionBuilder.new(
      Loader.Cardano.LinearFee.new(
        Loader.Cardano.BigNum.from_str(this.feePerByte.toString()),
        Loader.Cardano.BigNum.from_str(this.baseFee.toString())
      ),
      Loader.Cardano.BigNum.from_str(this.minUtxoValue),
      Loader.Cardano.BigNum.from_str(this.poolDeposit),
      Loader.Cardano.BigNum.from_str(this.keyDeposit),
      this.maxValSize,
      this.maxTxSize,
      this.priceMem,
      this.priceStep
    )
    
    CoinSelection.setProtocolParameters(
      this.minUtxoValue,
      this.feePerByte.toString(),
      this.baseFee.toString(),
      this.maxTxSize
    )
    
    let convertedUtxo = await Promise.all(
      utxos.map(async utxo => await utxoFromJson(utxo))
    )
    
    let outputs = null
    let minAda = 0
    const minFee = txBuilder.min_fee().to_str()
    
    if (sendAll) {
      let output = {
        address: outputAddress,
        amount: []
      }
      let amounts = {}
      const finalFee = +fee || +minFee
      
      for (let utxo of utxos) {
        for (let item of utxo.amount) {
          if (!amounts[item.unit]) amounts[item.unit] = 0
          amounts[item.unit] += +item.quantity
        }
      }
      
      for (let key in amounts) {
        let quantity = amounts[key]
        
        if (key === 'lovelace') {
          quantity -= finalFee
        }
        output.amount.push({
          unit: key,
          quantity: quantity.toString()
        })
      }
      
      outputs = await getOutputs(output)
      txBuilder.set_fee(Loader.Cardano.BigNum.from_str(finalFee.toString()))
    } else {
      if (token) {
        const output = {
          address: outputAddress,
          amount: [
            {
              unit: 'lovelace',
              quantity: this.minUtxoValue
            }
          ]
        }
        output.amount.push({
          unit: token.contract,
          quantity: amount.toString()
        })
        const outputValue = await assetsToValue(output.amount)
        
        minAda = await minAdaRequired(
          outputValue,
          Loader.Cardano.BigNum.from_str(this.minUtxoValue)
        )
        
        output.amount[0].quantity = minAda
        outputs = await getOutputs(output)
      } else {
        const output = {
          address: outputAddress,
          amount: [
            {
              unit: 'lovelace',
              quantity: amount.toString()
            }
          ]
        }
        outputs = await getOutputs(output)
      }
    }
    
    const totalAssets = await multiAssetCount(
      outputs.get(0).amount().multiasset()
    )
    const selection = await CoinSelection.randomImprove(
      convertedUtxo,
      outputs,
      20 + totalAssets
    )
    
    let utxoSum = 0

    for (let utxo of selection.input) {
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      )
      utxoSum += +utxo.output().amount().coin().to_str()
    }
    
    txBuilder.add_output(outputs.get(0))
    
    const ttl = this.slot + 1000
    txBuilder.set_ttl(ttl)
    
    // let convchange = await valueToAssets(selection.change)
    
    if (!sendAll) {
      const finalFee = fee || minFee
      
      txBuilder.set_fee(Loader.Cardano.BigNum.from_str(finalFee.toString()))
      
      let changeAmountVal

      if (minAda && token) {
        changeAmountVal = utxoSum - minAda - finalFee
      } else {
        changeAmountVal = utxoSum - amount - finalFee
      }
      
      if (changeAmountVal < 0) {
        throw new Error('Not enough ADA funds for fee')
      }

      const changeAmount = Loader.Cardano.Value.new(
        Loader.Cardano.BigNum.from_str(changeAmountVal.toString())
      )
      
      if (selection.change.multiasset()) {
        changeAmount.set_multiasset(selection.change.multiasset())
      }
      txBuilder.add_output(
        Loader.Cardano.TransactionOutput.new(
          Loader.Cardano.Address.from_bech32(changeAddress),
          changeAmount
        )
      )
    }
    
    const size = txBuilder.full_size()
    let finalFee = this.feePerByte * size + this.baseFee
    finalFee = parseInt(finalFee * 1.1)

    if (finalFee > fee) {
      if (!rebuild) {
        return await this.createTxBody({
          utxos,
          outputAddress,
          changeAddress,
          amount,
          fee: finalFee,
          token,
          sendAll,
          rebuild: true
        })
      }
      
      return txBuilder.build()
    } else {
      return txBuilder.build()
    }
  }
  
  async buildTx(txBody, keys) {
    const txHash = Loader.Cardano.hash_transaction(txBody)
    const witnesses = Loader.Cardano.TransactionWitnessSet.new()
    const vkeyWitnesses = Loader.Cardano.Vkeywitnesses.new()
    const inputs = txBody.inputs()
    const usedKeys = []
    
    for (let i = 0; i < inputs.len(); i++) {
      const input = inputs.get(i)
      const inputHash = Buffer.from(
        input.transaction_id().to_bytes()
      ).toString('hex')
      const txId = input.index()
    
      let find = keys.find(item => item.hash === inputHash && txId === item.txId)
      if (find) {
        usedKeys.push(find)
      }
    }
    let filteredKeys = usedKeys.filter((item, index, self) =>
      index === self.findIndex((t) => t.prvKeyHex === item.prvKeyHex)
    )
    filteredKeys.forEach((key) => {
      let signingKey = Loader.Cardano.PrivateKey.from_extended_bytes(key.key)
      const vkey = Loader.Cardano.make_vkey_witness(txHash, signingKey);
      vkeyWitnesses.add(vkey);
    })
    
    witnesses.set_vkeys(vkeyWitnesses)
  
    const transaction = Loader.Cardano.Transaction.new(
      txBody,
      witnesses,
      undefined // transaction metadata
    )
  
    const size = transaction.to_bytes().length * 2
  
    if (size > this.maxTxSize) {
      throw new Error(`Transaction size to big. More then ${ this.maxTxSize }`)
    }
  
    return Buffer.from(transaction.to_bytes(), 'hex').toString('hex')
  }
}

export const utxoFromJson = async (output) => {
  await Loader.load()
  
  return Loader.Cardano.TransactionUnspentOutput.new(
    Loader.Cardano.TransactionInput.new(
      Loader.Cardano.TransactionHash.from_bytes(
        Buffer.from(output.tx_hash, 'hex')
      ),
      output.output_index
    ),
    Loader.Cardano.TransactionOutput.new(
      Loader.Cardano.Address.from_bech32(output.addr),
      await assetsToValue(output.amount)
    )
  )
}

export const getOutputs = async (jsonOutput = {}) => {
  await Loader.load()
  const outputs = Loader.Cardano.TransactionOutputs.new()
  const convertedAmount = await assetsToValue(jsonOutput.amount)
  const address = await getAddress(jsonOutput.address)

  if (!address) {
    throw new Error('Invalid address')
  }
  
  outputs.add(
    Loader.Cardano.TransactionOutput.new(
      address,
      convertedAmount
    )
  )
  
  return outputs
}

export const bytesAddressToBinary = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '')

export const getAddress = async (address) => {
  await Loader.load()
  // const network = await getNetwork();
  try {
    const addr = Loader.Cardano.Address.from_bech32(address)
    const prefix = bytesAddressToBinary(addr.to_bytes()).slice(0, 4)

    if (
      prefix == '0111' ||
      prefix == '0011' ||
      prefix == '0001' ||
      prefix == '0101'
    ) {
      return false
    }
    // if (
    //   (addr.network_id() === 1 && network.id === NETWORK_ID.mainnet) ||
    //   (addr.network_id() === 0 && network.id === NETWORK_ID.testnet)
    // )
    return addr
    // return false;
  }
  catch (e) {}
  try {
    const addr = Loader.Cardano.ByronAddress.from_base58(address)
    // if (
    //   (addr.network_id() === 1 && network.id === NETWORK_ID.mainnet) ||
    //   (addr.network_id() === 0 && network.id === NETWORK_ID.testnet)
    // )
    return addr.to_address()
    // return false;
  }
  catch (e) {}
  // return false;
}

export const assetsToValue = async (assets) => {
  await Loader.load()
  const multiAsset = Loader.Cardano.MultiAsset.new()
  const lovelace = assets.find((asset) => asset.unit === 'lovelace')
  const policies = [
    ...new Set(
      assets
        .filter((asset) => asset.unit !== 'lovelace')
        .map((asset) => asset.unit.slice(0, 56))
    )
  ]
  
  policies.forEach((policy) => {
    const policyAssets = assets.filter(
      (asset) => asset.unit.slice(0, 56) === policy
    )
    const assetsValue = Loader.Cardano.Assets.new()
    policyAssets.forEach((asset) => {
      assetsValue.insert(
        Loader.Cardano.AssetName.new(Buffer.from(asset.unit.slice(56), 'hex')),
        Loader.Cardano.BigNum.from_str(asset.quantity)
      )
    })
    multiAsset.insert(
      Loader.Cardano.ScriptHash.from_bytes(Buffer.from(policy, 'hex')),
      assetsValue
    )
  })
  const value = Loader.Cardano.Value.new(
    Loader.Cardano.BigNum.from_str(lovelace ? lovelace.quantity : '0')
  )
  if (assets.length > 1 || !lovelace) value.set_multiasset(multiAsset)
  
  return value
}

export const multiAssetCount = async (multiAsset) => {
  await Loader.load()
  
  if (!multiAsset) return 0
  
  let count = 0
  const policies = multiAsset.keys()
  
  for (let j = 0; j < multiAsset.len(); j++) {
    const policy = policies.get(j)
    const policyAssets = multiAsset.get(policy)
    const assetNames = policyAssets.keys()
    for (let k = 0; k < assetNames.len(); k++) {
      count++
    }
  }
  return count
}


export const minAdaRequired = async (value, minUtxo) => {
  await Loader.load()
  return Loader.Cardano.min_ada_required(value, minUtxo).to_str()
}

export const valueToAssets = async (value) => {
  await Loader.load()
  const assets = []
  assets.push({unit: 'lovelace', quantity: value.coin().to_str()})
  
  if (value.multiasset()) {
    const multiAssets = value.multiasset().keys()
    for (let j = 0; j < multiAssets.len(); j++) {
      const policy = multiAssets.get(j)
      const policyAssets = value.multiasset().get(policy)
      const assetNames = policyAssets.keys()
      for (let k = 0; k < assetNames.len(); k++) {
        const policyAsset = assetNames.get(k)
        const quantity = policyAssets.get(policyAsset)
        const asset =
          Buffer.from(policy.to_bytes(), 'hex').toString('hex') +
          Buffer.from(policyAsset.name(), 'hex').toString('hex')
        const _policy = asset.slice(0, 56)
        // const _name = asset.slice(56)
        // const fingerprint = new AssetFingerprint(
        //   Buffer.from(_policy, 'hex'),
        //   Buffer.from(_name, 'hex')
        // ).fingerprint();
        assets.push({
          unit: asset,
          quantity: quantity.to_str(),
          policy: _policy
          // name: hexToAscii(_name),
          // fingerprint,
        })
      }
    }
  }
  // if (value.coin().to_str() == '0') return [];
  return assets
}
