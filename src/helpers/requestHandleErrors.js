/**
 * Handling requests
 * @param response
 * @returns {any | Promise<any>} Response decoded in json or error if the request failed
 */
export default function (response) {
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(response.statusText)
  }
}
