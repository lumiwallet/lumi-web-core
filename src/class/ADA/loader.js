/**
 * Loads the WASM modules
 */

import Cardano from './cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm'

class Loader {
  async load() {
    if (this._wasm) return
    /**
     * @private
     */

    this._wasm = await extractModule(Cardano)
    // this._wasm = await import('./cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm').catch(console.error)
    // this._wasm = await import('@emurgo/cardano-serialization-lib-browser').catch(console.error)
  }

  get Cardano() {
    return this._wasm
  }
}

const extractModule = async (module) => {
  const { instance } = await module();
  return instance.exports;
}

export default new Loader()
