interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filters: { key: string; label: string; value: string; options: FilterOption[] }[];
  onFilterChange: (key: string, value: string) => void;
  placeholder?: string;
}

export function SearchFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  placeholder = "Search…",
}: Props) {
  return (
    <div className="filters">
      <input
        type="search"
        className="filters__search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {filters.map((f) => (
        <select
          key={f.key}
          className="filters__select"
          value={f.value}
          onChange={(e) => onFilterChange(f.key, e.target.value)}
          aria-label={f.label}
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
