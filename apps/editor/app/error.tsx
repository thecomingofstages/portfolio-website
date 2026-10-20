"use client";

/** Any read that failed: the admin API is down, the token was refused, or a setting is missing. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3">
      <h1>Could not load</h1>
      <p className="text-muted">
        {process.env.NODE_ENV === "development" ? error.message : "The admin API did not answer. Try again, or check the editor's settings."}
      </p>
      <div>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
