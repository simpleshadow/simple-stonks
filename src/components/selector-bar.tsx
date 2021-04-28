type SelectorBarProps = {
  labels: string[]
  selectedIndex: number
  onSelectionChange: (newIndex: number) => void
}

const SelectorBar = ({ labels, selectedIndex, onSelectionChange }: SelectorBarProps) => {
  return (
    <div className="flex flex-row items-center text-xs">
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
