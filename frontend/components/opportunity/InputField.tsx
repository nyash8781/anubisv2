'use client'

export function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  error,
  required,
}: {
  label: string
  value?: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-red-500">*</span>}
      </div>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
        className={`w-full rounded-xl border ${error ? 'border-red-500 bg-red-50' : 'border-border bg-background'} px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20`}
      />
      {error && (
        <p id={`${label}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </label>
  )
}
