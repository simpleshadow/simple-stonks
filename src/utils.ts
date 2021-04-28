export const formatInterval = (minutes: number) => {
  let intervalString = `${minutes}m`
  switch (minutes) {
    case 60:
      intervalString = '1h'
      break
    case 6 * 60:
      intervalString = '6h'
      break
    case 24 * 60:
      intervalString = '1D'
      break
    default:
      break
  }
  return intervalString
}
