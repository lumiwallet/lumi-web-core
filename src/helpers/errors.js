export default {
  err_core_mnemonic: 'Wrong mnemonic phrase. Please, check the spelling and try again',
  err_core_mnemonic_length: 'Bad word count for mnemonic',
  err_core_mnemonic_empty: 'Invalid mnemonic',
  err_core_seed: 'Invalid seed',
  err_core_entropy: 'Bad entropy',
  err_core_xprv: 'Invalid xprv',
  err_core_hdkey: 'Invalid hdkey',
  err_core_btc_node: 'Error generating address. Check BTC node',
  err_core_btc_type: 'Invalid bitcoin address type. Supported types are p2pkh and p2wpkh',
  err_core_eth_node: 'Error generating ETH private key. Check ETH node',
  err_core_eth_private_key: 'Error generating ETH public key. Check ETH private key',
  err_core_eth_public_key: 'Error generating ETH address. Check ETH public key',
  err_core_eth_account: 'Invalid account. It must be an integer',
  err_core_derivation: 'Problem with derivation. Check node and derivation path',
  err_core_derivation_hdkey: 'HDkey is required',
  err_core_derivation_path: 'Invalid derivation path',
  err_core_derivation_range: 'Bad range. Check from/to params',
  err_core_private_key: 'Invalid private key. Expect buffer',
  err_tx_btc_balance: 'Insufficient balance',
  err_tx_btc_build: 'BTC transaction failed. Check all parameters',
  err_tx_btc_amount: 'Invalid amount. Amount must be a Number',
  err_tx_btc_fee: 'Invalid fee. Fee must be a Object with \`SAT\` parameter',
  err_tx_btc_unspent: 'Invalid unspent. Try to resync the BTC wallet',
  err_tx_btc_raw_tx: 'Problem getting raw transaction. Try to send again',
  err_tx_bch_amount: 'Invalid amount. Amount must be a Number',
  err_tx_bch_fee: 'Invalid fee. Fee must be a Object with \`SAT\` parameter',
  err_tx_bch_balance: 'Insufficient balance',
  err_tx_bch_build: 'BCH transaction failed. Check all parameters',
  err_tx_eth_balance: 'Insufficient balance',
  err_tx_eth_address: 'Invalid ethereum address',
  err_tx_eth_build: 'ETH transaction failed. Check all parameters',
  err_tx_bnb_build: 'BNB transaction failed. Check all parameters',
  err_tx_eth_invalid_params: 'Invalid params. Nonce, value, gas price and gas limit have to be a number',
  err_tx_eth_invalid_params_string: 'Invalid params. Parameters "to" must be string based',
  err_tx_btcv_balance: 'Insufficient balance',
  err_tx_btcv_amount: 'Invalid amount. Amount must be a Number',
  err_tx_btcv_fee: 'Invalid fee. Fee must be a Object with \`SAT\` parameter',
  err_wallet_exist: 'Wallet not created. Use this method after creating a wallet',
  err_wallet_api: 'Api is not found! Please, use the setter apiEndpoint to install',
  err_wallet_api_type: 'Api must be an object!',
  err_btc_private_key_by_index: 'Key generation problem. Check the node and derivation index',
  err_get_bch_address: 'Problem with address conversion. Check the format of the source address',
  err_tx_doge_amount: 'Invalid amount. Amount must be a Number',
  err_tx_doge_fee: 'Invalid fee. Fee must be a Object with \`SAT\` parameter',
  err_tx_doge_balance: 'Insufficient balance',
  err_tx_doge_build: 'DOGE transaction failed. Check all parameters',
  err_tx_doge_raw_tx: 'Problem getting raw transaction. Try to send again',
  err_sync_coin: 'Coin is required',
  err_sync_coin_not_supported: 'Selected coin is not supported for sync',
}
