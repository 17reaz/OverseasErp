export function CandidateFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        placeholder="Search candidates..."
        className="h-9 rounded-md border px-3 text-sm"
      />

      <button
        type="button"
        className="h-9 rounded-md border px-3 text-sm"
      >
        Filter
      </button>

      <button
        type="button"
        className="h-9 rounded-md border px-3 text-sm"
      >
        Sort
      </button>
    </div>
  );
}