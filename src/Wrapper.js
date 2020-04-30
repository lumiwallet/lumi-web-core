import Worker from 'worker-loader!./workers/wallet.worker.js'

const resolves = {}
const rejects = {}
let globalMsgId = 0

/**
 * Class Wrapper
 * @class
 *
 * Wrapper for communicating with Web Workers, using Promises
 */

export default class Wrapper {
  constructor () {
    this.worker = new Worker()
    this.worker.onmessage = handleMsg
  }
  
  /**
   * Main class method. Send message to the worker
   * @param {string} method - Method name
   * @param {Object} value - Data set for a specific method
   * @returns {*|Promise<Object>} - An object with data that depends on a specific method
   */
  method (method, value) {
    return sendMsg({method, value}, this.worker)
  }
}

/**
 * Activate calculation in the worker, returning a promise
 * @param {Object} payload
 * @param {worker} worker
 * @returns {Promise<Object>}
 */

function sendMsg (payload, worker) {
  const msgId = globalMsgId++

  const msg = {
    id: msgId,
    payload
  }

  return new Promise(function (resolve, reject) {
    resolves[msgId] = resolve
    rejects[msgId] = reject
    worker.postMessage(msg)
  })
}

/**
 * Handle incoming calculation result
 * @param {Object} msg
 */

function handleMsg (msg) {
  const {id, error, payload} = msg.data
  if (error) {
    const reject = rejects[id]
    if (reject) {
      if (error) {
        reject(error)
      } else {
        reject('Got nothing')
      }
    }
  } else if (payload) {
    const resolve = resolves[id]
    if (resolve) {
      resolve(payload)
    }
  }
}
