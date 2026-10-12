// TODO(wording): the 404 message is not decided yet.
const NOT_FOUND_TEXT = "<...>";

// Shown for missing paths and for anything the API answers with 404
// (hidden projects, tracks and yearbooks). It says nothing about the data.
export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h1>404</h1>
      <p className="text-muted">{NOT_FOUND_TEXT}</p>
    </div>
  );
}
