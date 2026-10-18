import type { BlockProps } from ".";

const BASE_CLASS =
  "inline-flex items-center justify-center rounded-button px-6 py-2.5 font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-accent";

const PRIMARY_CLASS = "bg-accent text-background hover:bg-accent-hover";
const SECONDARY_CLASS = "border border-accent text-accent hover:border-accent-hover hover:text-accent-hover";

export default function ButtonBlock({ block }: BlockProps<"button">) {
  const { title, buttons, align } = block;
  const centered = align === "center";

  return (
    <div className={`flex flex-col gap-6 py-8 ${centered ? "items-center text-center" : ""}`}>
      {title ? <h2>{title}</h2> : null}
      <div className={`flex flex-wrap gap-4 ${centered ? "justify-center" : "justify-start"}`}>
        {buttons.map((button, index) => (
          <a
            key={`${button.url}-${index}`}
            href={button.url}
            className={`${BASE_CLASS} ${button.style === "secondary" ? SECONDARY_CLASS : PRIMARY_CLASS}`}
          >
            {button.label}
          </a>
        ))}
      </div>
    </div>
  );
}
