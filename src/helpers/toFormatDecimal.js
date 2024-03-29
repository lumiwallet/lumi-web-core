import bigDecimal from 'js-big-decimal'

/**
 * Formatting numbers with the number of digits after the decimal point
 * @param {number|string} value - Value for formatting
 * @param {number} x - Number of digits after the decimal point
 * @param {boolean} floor - type of rounding
 * @returns {string} Formatted value or 0 if no value is specified
 */
export default function (value, x = 8, floor = false) {
  value = parseFloat(value)

  if (!value) return '0'

  let bigNum = new bigDecimal(value)
  let num

  if (floor) {
    num = bigNum.round(x, bigDecimal.RoundingModes.DOWN)
  } else {
    num = bigNum.round(x, bigDecimal.RoundingModes.CEILING)
  }

  num = num.value

  while (num[num.length - 1] === '0') {
    num = num.slice(0, -1)
  }

  if (num[num.length - 1] === '.') {
    num = num.slice(0, -1)
  }

  return num
}
