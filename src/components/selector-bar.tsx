type SelectorBarProps = {
  isVertical?: boolean
  labels: string[] | readonly string[]
  onSelectionChange: (newIndex: number) => void
  selectedIndex: number
}

const SelectorBar = ({ isVertical, labels, selectedIndex, onSelectionChange }: SelectorBarProps) => {
  return (
    <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} flex-wrap items-center text-xs`}>
      {labels.map((label, i) => (
        <div
          key={label}
          className={`${
            i === selectedIndex ? 'opacity-100 font-bold' : 'opacity-50'
          } p-2 select-none hover:opacity-75`}
          onClick={() => onSelectionChange(i)}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

export default SelectorBar
