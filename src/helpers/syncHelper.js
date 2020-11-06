import {getBtcAddress} from '@/helpers/coreHelper'

/**
 * Auxiliary method that gets the Bitcoin address by node and index
 * @param {Object} node - Bitcoin node
 * @param {string} type - Node type (external or internal)
 * @param {number} from - The index that the derivation starts from
 * @param {number} to - Index to which deprivation occurs
 * @returns {Promise<Object>} Returns array of addresses
 * @private
 */

export async function getArrayOfBtcAddresses (node, from, to, deriveAddress) {
  let addresses = []
  let addressesObj = {}
  
  for (let i = from; i < to; i++) {
    let address = ''
    
    if (deriveAddress.hasOwnProperty(i)) {
      address = deriveAddress[i]
    } else {
      address = getBtcAddress(node, i)
    }
    
    addressesObj[i] = address
    addresses.push(address)
  }
  
  return {addresses, addressesObj}
}

export async function getSyncAddressPromises (externalNode, internalNode, getAddressesFunction) {
  const nodeData = [
    {
      node: externalNode,
      type: 'external'
    }, {
      node: internalNode,
      type: 'internal'
    }
  ]

  const pArray = nodeData.map(async item => {
    return await getAddressesFunction(
      item.node,
      item.type
    )
  })
  
  const addresses = await Promise.all(pArray)
  const data = {
    external: addresses[0],
    internal: addresses[1]
  }
  
  data.empty = {
    external: addresses.external[addresses.external.length - 1],
    internal: addresses.internal[addresses.internal.length - 1]
  }
  
  data.all = [...data.external, ...data.internal].map((item) => item.address)
  console.log('!data', data)
  return data
}
