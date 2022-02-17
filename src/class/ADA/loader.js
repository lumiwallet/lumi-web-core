/**
 * Loads the WASM modules
 */

class Loader {
  async load() {
    if (this._wasm) return
    /**
     * @private
     */

    this._wasm = await import('@emurgo/cardano-serialization-lib-browser')
  }

  get Cardano() {
    return this._wasm
  }

  // get Message() {
  //   return this._wasm2;
  // }
}

export default new Loader()
