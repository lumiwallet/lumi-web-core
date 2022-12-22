export const getCurrentTimestamp = () => {
  const date = new Date().getTime()

  return Math.round(date / 1000)
}

export const getOffsetTimestamp = (days) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return Math.round(date.getTime() / 1000)
}
