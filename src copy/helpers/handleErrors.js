import errors from '@/helpers/errors'

/**
 * Custom error object.
 * By the error code it substitutes the desired message from object 'errors'
 * @extends Error
 */

class CustomError extends Error {
  constructor(code) {
    super(code)
    this.name = 'CustomError'
    this.message = errors.hasOwnProperty(code) ? `${code}: ${errors[code]}` : 'Uncaught error'
  
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error()).stack
    }
  }
}

export default CustomError
