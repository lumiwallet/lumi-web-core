import * as ethUtil from 'ethereumjs-util'

/**
 * Getting a Ethereum private key by node
 * @param {Object} node - Ethereum node
 * @returns {Buffer} Ethereum private key in Uint8Array format
 */

export function getEthPrivateKey(node) {
  try {
    return node._privateKey
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_node')
  }
}

/**
 * Getting a Ethereum public key by private key
 * @param {Buffer} privateKey - Ethereum private key
 * @returns {Buffer} Ethereum public key in Uint8Array format
 */

export function getEthPublicKey(privateKey) {
  try {
    return ethUtil.privateToPublic(privateKey)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_private_key')
  }
}

/**
 * Getting a Ethereum wallet address by public key
 * @param {Buffer} publicKey - Ethereum public key
 * @returns {string} Ethereum wallet address
 */

export function getEthAddress(publicKey) {
  try {
    const addr = ethUtil.Address.fromPublicKey(publicKey)
    return addr.toString()
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_public_key')
  }
}

/**
 * Getting Ethereum wallet address by node
 * @param {Object} node - Ethereum node
 * @returns {string} Ethereum wallet address
 */

export function getEthAddressByNode(node) {
  try {
    let privateKey = getEthPrivateKey(node)
    let publicKey = getEthPublicKey(privateKey)
    return getEthAddress(publicKey)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_public_key')
  }
}
