'use client'

const CATEGORIES = [
  'Legal', 'Finance', 'Medical', 'Technical',
  'HR', 'Academic', 'Correspondence', 'Other',
]

interface Props {
  selected: string | null
  onChange: (category: string | null) => void
}

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(selected === cat ? null : cat)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selected === cat
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
