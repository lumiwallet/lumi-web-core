/**
 * Handling requests
 * @param response
 * @returns {any | Promise<any>} Response decoded in json or error if the request failed
 */
export default function (response) {
  if (response.ok) {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.indexOf('application/json') !== -1) {
      return response.json()
    } else {
      return response.text()
    }
  } else {
    throw new Error(response.statusText)
  }
}
