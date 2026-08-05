"use client";

const INPUT_CLASSES =
  "rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10";

interface FieldProps {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}

export function Field({
  label,
  id,
  type,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASSES}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT_CLASSES} resize-none`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  description?: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, description, id, checked, onChange }: CheckboxFieldProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none accent-orange-600"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </span>
    </label>
  );
}

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectFieldOption[];
  placeholder?: string;
  error?: string;
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT_CLASSES} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2378716c%22><path d=%22M5.5 7.5l4.5 4.5 4.5-4.5%22 stroke=%22%2378716c%22 stroke-width=%221.5%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-position-[right_0.75rem_center] bg-no-repeat pr-9`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
