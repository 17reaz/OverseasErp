export function CandidateForm() {
  return (
    <form className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="text-sm font-medium"
        >
          Name
        </label>

        <input
          id="name"
          name="name"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="code"
          className="text-sm font-medium"
        >
          Code
        </label>

        <input
          id="code"
          name="code"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-md border px-4 py-2"
      >
        Save Candidate
      </button>
    </form>
  );
}