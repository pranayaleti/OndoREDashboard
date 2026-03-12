interface PageSizeSelectorProps {
  pageSize: number;
  onChange: (size: number) => void;
  options?: number[];
}

export function PageSizeSelector({
  pageSize,
  onChange,
  options = [10, 25, 50],
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span>Show</span>
      <select
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span>per page</span>
    </div>
  );
}
