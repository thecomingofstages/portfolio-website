"use client";

// TODO(wording): the error message and the retry button label are not decided yet.
const ERROR_TEXT = "<...>";
const RETRY_LABEL = "<...>";

// Any error other than a 404 from the API ends up here. It never shows the
// error's message or details, only a way to try again.
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h1>{ERROR_TEXT}</h1>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-button bg-accent px-4 py-2 text-background hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {RETRY_LABEL}
      </button>
    </div>
  );
}
