import { GenericComponent } from '@react-financial-charts/core'
import { createContext, FC, MutableRefObject, useContext, useRef } from 'react'

interface SyncedCursorTimeContextInterface {
  cursorLineTimeRef: MutableRefObject<number>
}

export const SyncedCursorTimeContext = createContext<SyncedCursorTimeContextInterface | null>(null)

export const useSyncedCursorTime = () => {
  const context = useContext(SyncedCursorTimeContext)
  const cursorLineTimeRef = useRef<number>()

  context.cursorLineTimeRef = cursorLineTimeRef

  return context
}

type SyncedCursorTimeProps = {
  handleMouseMove: (index: number) => void
  index: number
}

export const SyncedCursorTime: FC<SyncedCursorTimeProps> = ({ handleMouseMove, index, children }) => {
  const cursorLineTimeRef = useRef<number>()
  return (
    <SyncedCursorTimeContext.Provider value={{}}>
      <GenericComponent
        clip={false}
        onMouseMove={() => {
          handleMouseMove && handleMouseMove(index)
        }}
        onUnHover={() => {
          cursorLineTimeRef.current = undefined
          handleMouseMove && handleMouseMove(index)
        }}
        canvasDraw={(_, { currentItem }) => {
          if (currentItem?.time) {
            myCursorLineTimeRef.current = currentItem.time
          }
        }}
        canvasToDraw={getMouseCanvas}
        drawOn={['mousemove', 'mouseleave']}
      />
      {children}
    </SyncedCursorTimeContext.Provider>
  )
}
