import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import 'react-day-picker/style.css'

function DatePicker({ selected, onSelect, highlightedDates = [], align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const highlightedSet = new Set(highlightedDates)

  function isHighlighted(day) {
    return highlightedSet.has(format(day, 'yyyy-MM-dd'))
  }

  function handleSelect(day) {
    if (day) {
      onSelect(day)
      setIsOpen(false)
    }
  }

  const popupPositionClass = align === 'right' ? 'right-0 mr-1' : 'left-0'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded border border-gray-300 bg-white px-3 py-2 text-left"
      >
        {selected ? format(selected, 'dd/MM/yyyy') : 'Select a date'}
      </button>

      {isOpen && (
        <div
          className={`absolute ${popupPositionClass} z-20 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg`}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={enGB}
            modifiers={{ highlighted: isHighlighted }}
            modifiersClassNames={{
              highlighted: 'bg-blue-100 text-blue-700 rounded-full',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DatePicker