const defaultNoRestoredParams = ['externalNode', 'internalNode', 'headers', 'request']

export const restoreClass = (obj, restoredData, noRestoredParams = []) => {
  const params = noRestoredParams.length ? noRestoredParams : defaultNoRestoredParams

  if (!restoredData || typeof restoredData !== 'object') return
  for (let key in restoredData) {
    if (!params.includes(key) && key in obj) {
      obj[key] = restoredData[key]
    }
  }
}
