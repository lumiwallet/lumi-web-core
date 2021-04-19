import handleErrors from './requestHandleErrors'

/**
 * Class Request.
 * Wrapper for making requests
 * @class
 */

export default class Request {
  /**
   * Create a Request
   * @param {string} url - Base url
   * @param {Object} headers - Request headers
   * @param {Object} basicData - A set of basic data that will participate in all requests in the 'body' object
   */
  constructor (url, headers = {}, basicData = {}) {
    this.url = url
    this.basicData = basicData
    this.headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...headers
    })
  }
  
  /**
   * Method for sending the request
   * @param {Object} params - Request parameter
   * @param {string} method - Request method
   * @param {string} type - Type of request. Default 'POST'
   * @returns {Promise<Object>}
   */
  
  send (params = {}, method, type = 'POST') {
    let fullUrl = this.url
    let body = null
    
    if (method) {
      fullUrl += `/${ method }`
    }
    
    if (type === 'POST') {
      body = JSON.stringify({...params, ...this.basicData})
    } else {
      fullUrl += '?' + this.serialize(params)
    }
    
    let initParams = {
      method: type,
      headers: this.headers,
      body: body
    }
    
    return new Promise((resolve, reject) => {
      fetch(fullUrl, initParams)
        .then(handleErrors)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          console.log('Request Class Error', err)
          reject(err)
        })
    })
  }
  
  /**
   * Serialize parameters for GET requests
   * @param {Object} obj - Parameters to serialize
   * @returns {string}
   */
  
  serialize (obj) {
    if (!obj || typeof obj !== 'object') return ''
    
    return Object.keys(obj)
      .reduce(function (a, k) {
        a.push(k + '=' + encodeURIComponent(obj[k]))
        return a
      }, [])
      .join('&')
  }
}
