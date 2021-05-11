import { useEffect, useRef, useState } from 'react'

const useDeviceRatio = () => {
  const [ratio, setRatio] = useState(1)
  useEffect(() => {
    const canvasEl = document.createElement('canvas')
    const canvasContext: any = canvasEl.getContext('2d')

    const { devicePixelRatio } = window

    const backingStoreRatio =
      canvasContext.webkitBackingStorePixelRatio ??
      canvasContext.mozBackingStorePixelRatio ??
      canvasContext.msBackingStorePixelRatio ??
      canvasContext.oBackingStorePixelRatio ??
      canvasContext.backingStorePixelRatio ??
      1

    setRatio(devicePixelRatio / backingStoreRatio)
  }, [])

  return ratio
}

export default useDeviceRatio
