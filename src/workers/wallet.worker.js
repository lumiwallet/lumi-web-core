import WalletWrapper from '@/class/WalletWrapper'

let Wrapper = {}

/**
 * Creating a wallet core
 *
 * @param {Object} payload - Data for creating a core. Include in the creation method and mnemonic or key
 * @param {number} id - Promise id
 * @returns {Promise<Object>} Returns information about the core
 */

async function create (payload, id) {
  try {
    Wrapper = new WalletWrapper(payload)
    await Wrapper.Create()
    postMessage({
      id,
      payload: Wrapper.core.DATA
    })
  }
  catch (e) {
    postMessage({
      id,
      error: e.message
    })
  }
}

/**
 * Creating a core for each supported currency type
 *
 * @param payload - Array of coins to create cores for
 * @param id - Promise id
 * */

async function createCoins (payload, id) {
  try {
    const cores = await Wrapper.CreateCoins(payload)
    postMessage({
      id,
      payload: cores
    })
  }
  catch (e) {
    postMessage({
      id,
      error: e.message
    })
  }
}

/**
 * Creating a transaction or getting fee
 *
 * @param payload - Transaction method and input data for the transaction
 * @param id - Promise id
 * @returns {Promise<Object>} Returns information about the success or failure of sending a transaction.
 * Or it returns the fee list
 */

async function transaction (payload, id) {
  try {
    let txs = await Wrapper.Transaction(payload)
    postMessage({
      id,
      payload: txs
    })
  }
  catch (e) {
    postMessage({
      id,
      error: e.message
    })
  }
}

/**
 * Handler that runs the main wallet methods.
 * Methods such as create, sync, transaction and getNodes
 * @param e - event. Get parameters id and payload from the e.data object
 * @returns {Promise<Object>} Returns a data set that depends on the specific method
 */

/* eslint-disable no-undef */
onmessage = async (e) => {
  const {id, payload} = e.data
  
  if (
    !payload ||
    !payload.hasOwnProperty('method') ||
    !payload.hasOwnProperty('value')
  ) {
    postMessage({
      id,
      payload: 'error'
    })
    return
  }
  
  switch (payload.method) {
    case 'create':
      return await create(payload.value, id)
    case 'createCoins':
      return await createCoins(payload.value, id)
    case 'sync':
      const syncRes = await Wrapper.Sync(payload.value)
      postMessage({
        id,
        payload: syncRes
      })
      break
    case 'transaction':
      return transaction(payload.value, id)
    case 'getNodes':
      const nodes = await Wrapper.core.getChildNodes(payload.value)
      postMessage({
        id,
        payload: nodes
      })
      break
    default:
      postMessage({
        id,
        payload: 'worker error'
      })
  }
}
