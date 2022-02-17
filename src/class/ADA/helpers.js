import bigDecimal from 'js-big-decimal'

const DECIMALS_LOVELACE = 6

export function convertToUnit(ada, decimals = DECIMALS_LOVELACE) {
  if (!ada) return 0
  if (!Number.isInteger(decimals) || decimals === 0) return bigDecimal.round(ada, 0, bigDecimal.RoundingModes.DOWN)
  let value = bigDecimal.multiply(ada, Math.pow(10, decimals))
  return bigDecimal.round(value, 0, bigDecimal.RoundingModes.DOWN)
}

export function convertFromUnit(lovelace, decimals = DECIMALS_LOVELACE) {
  if (!lovelace) return 0
  if (!Number.isInteger(decimals) || decimals === 0) return lovelace
  return +bigDecimal.divide(lovelace, Math.pow(10, decimals), decimals)
}
