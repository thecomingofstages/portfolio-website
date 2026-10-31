"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Media from "@/components/Media";
import { formatDate, formatYear } from "@/lib/dates";
import type { ProjectCard } from "@/types/api";

export type ShelfProps = {
  /** The list of projects to display on the shelf. */
  projects: ProjectCard[];
  /** Whether to show the year filter tabs. Default: false. */
  showFilter?: boolean;
  /** Whether to show the reverse order toggle button. Default: false. */
  showToggle?: boolean;
  /** Whether to show the "See all" link to /projects. Default: false. */
  showSeeAll?: boolean;
  /** Optional title rendered above the shelf component. */
  title?: string | null;
};

/**
 * Normalizes offset into [-half, half] so items wrap endlessly in a circle.
 */
function getCircularOffset(index: number, activeIndex: number, total: number): number {
  if (total <= 1) return 0;
  let diff = index - activeIndex;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Shelf shows projects on an endless circular cover-flow carousel (eye-level front view):
 * Center active cover is large, flanked by overlapping cards that seamlessly wrap around
 * in a loop as it rotates smoothly to the right.
 */
export default function Shelf({
  projects,
  showFilter = false,
  showToggle = false,
  showSeeAll = false,
  title,
}: ShelfProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Distinct available years from start_date, sorted descending (newest first)
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const year = formatYear(p.start_date);
      if (year) set.add(year);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [projects]);

  // Filtered and ordered projects list (never mutates original array)
  const displayedProjects = useMemo(() => {
    let list = [...projects];

    if (showFilter && selectedYear !== "all") {
      list = list.filter((p) => formatYear(p.start_date) === selectedYear);
    }

    if (showToggle && isReversed) {
      list.reverse();
    }

    return list;
  }, [projects, showFilter, selectedYear, showToggle, isReversed]);

  const count = displayedProjects.length;
  const activeIndex = count === 0 ? 0 : Math.min(selectedIndex, count - 1);

  // Moves to the next item in rightward rotation
  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
  }, [count]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
  }, [count]);

  const selectProjectIndex = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Auto-rotate: every time selectedIndex changes (user click or auto), cooldown resets to 5.5s
  useEffect(() => {
    if (count <= 1) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const timer = setTimeout(() => {
      setSelectedIndex((prev) => (prev + 1) % count);
    }, 5500); // 5.5s cooldown before moving to next project

    return () => clearTimeout(timer);
  }, [count, selectedIndex]);

  // Keyboard navigation for arrow keys ← and →
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        selectNext();
      }
    },
    [selectPrevious, selectNext],
  );

  const selectedProject = displayedProjects[activeIndex] ?? null;
  const selectedYearText = selectedProject ? formatYear(selectedProject.start_date) : null;
  const selectedDateText = selectedProject ? formatDate(selectedProject.start_date) : "";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-6 py-6 md:py-8"
      aria-label="Projects shelf"
    >
      {/* Header section: Title, Controls, or See all link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {title ? (
          <h2 className="font-heading text-h2 font-bold text-foreground">{title}</h2>
        ) : (
          <div />
        )}

        {showSeeAll && (
          <Link
            href="/projects"
            className="font-body text-body font-semibold text-accent hover:text-accent-hover transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded-button"
          >
            See all →
          </Link>
        )}
      </div>

      {/* Filter and Reverse Toggle Controls (/projects) */}
      {(showFilter || showToggle) && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
          {showFilter && (
            <div
              className="flex flex-wrap items-center gap-1.5 rounded-full border border-border/80 bg-card-bg/40 p-1"
              role="toolbar"
              aria-label="Filter by year"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("all");
                }}
                className={`rounded-full px-4 py-1 font-body text-body font-medium transition-all focus-visible:outline-2 focus-visible:outline-accent ${
                  selectedYear === "all"
                    ? "bg-accent text-background font-bold"
                    : "text-muted hover:bg-card-bg hover:text-foreground"
                }`}
                aria-pressed={selectedYear === "all"}
              >
                ALL
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(year);
                  }}
                  className={`rounded-full px-4 py-1 font-body text-body font-medium transition-all focus-visible:outline-2 focus-visible:outline-accent ${
                    selectedYear === year
                      ? "bg-accent text-background font-bold"
                      : "text-muted hover:bg-card-bg hover:text-foreground"
                  }`}
                  aria-pressed={selectedYear === year}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {showToggle && (
            <button
              type="button"
              onClick={() => {
                setIsReversed((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card-bg/60 px-4 py-1 font-body text-body text-muted transition-all hover:border-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={
                isReversed
                  ? "Sorted oldest first. Click to sort newest first"
                  : "Sorted newest first. Click to sort oldest first"
              }
            >
              <span aria-hidden="true" className="text-accent font-bold">⇅</span>
              <span>{isReversed ? "Oldest first" : "Newest first"}</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {count === 0 ? (
        <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-card-bg/40 p-8 text-center text-muted">
          <p className="font-body text-body">No projects found.</p>
        </div>
      ) : (
        /* Endless Circular Coverflow Display (multiple visible wings on sides) */
        <div className="flex flex-col gap-6">
          <div
            id={listboxId}
            role="listbox"
            aria-label="Projects list"
            aria-activedescendant={selectedProject ? `shelf-item-${selectedProject.slug}` : undefined}
            tabIndex={0}
            className="group relative flex min-h-[360px] md:min-h-[440px] w-full items-center justify-center overflow-hidden border border-border/80 bg-gradient-to-b from-card-bg/40 via-card-bg/20 to-transparent py-10 focus-visible:outline-2 focus-visible:outline-accent rounded-[var(--radius-card)]"
            style={{
              perspective: "1400px",
              perspectiveOrigin: "50% 50%", // Straight eye-level front view
            }}
          >
            {/* Ambient golden stage spotlight behind active center card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[80px]"
            />

            {/* Stage floor line reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 left-1/2 h-[1px] w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent"
            />

            {/* Centered Circular Stage */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: "100%",
                height: "320px",
                transformStyle: "preserve-3d",
              }}
            >
              {displayedProjects.map((project, index) => {
                const isSelected = index === activeIndex;
                const cover = project.pics && project.pics.length > 0 ? project.pics[0] : null;
                
                // Infinite circular wrap offset calculation
                const offset = getCircularOffset(index, activeIndex, count);
                const absOffset = Math.abs(offset);

                // Multi-tier layered overlapping:
                // Allows up to 4 visible cards on each side (total 9 cards in sight)
                const translateX =
                  offset === 0
                    ? 0
                    : Math.sign(offset) * (96 + (absOffset - 1) * 64);
                const translateZ = -absOffset * 36;
                const scale =
                  offset === 0
                    ? 1
                    : Math.max(0.55, 0.92 - (absOffset - 1) * 0.08);

                return (
                  <button
                    key={project.slug}
                    id={`shelf-item-${project.slug}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => selectProjectIndex(index)}
                    className={`absolute cursor-pointer flex flex-col items-center justify-center rounded-[var(--radius-card)] transition-all duration-1200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-accent`}
                    style={{
                      width: "195px",
                      height: "280px",
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
                      transformStyle: "preserve-3d",
                      zIndex: isSelected ? 50 : 40 - Math.min(30, Math.round(absOffset)),
                      opacity: absOffset > 4 ? 0 : isSelected ? 1 : Math.max(0.25, 0.95 - absOffset * 0.16),
                      pointerEvents: absOffset > 4 ? "none" : "auto",
                    }}
                  >
                    {/* Cover Art Card with clean rounded corners */}
                    <div
                      className={`relative w-full h-full overflow-hidden rounded-[var(--radius-card)] bg-card-bg border transition-all duration-1200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                        isSelected
                          ? "border-accent ring-2 ring-accent"
                          : "border-border/80 hover:border-accent/40"
                      }`}
                    >
                      {cover ? (
                        <Media
                          src={cover}
                          alt={project.name}
                          fill
                          sizes={isSelected ? "(min-width: 768px) 240px, 195px" : "150px"}
                          className="object-cover"
                        />
                      ) : (
                        <div
                          data-placeholder=""
                          className="flex h-full w-full items-center justify-center bg-card-bg"
                          aria-hidden="true"
                        />
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-foreground/10" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Project Details and Arrow Controls */}
          {selectedProject && (
            <div className="flex w-full items-center justify-between gap-3 sm:gap-6">
              {/* Previous button */}
              <button
                type="button"
                onClick={selectPrevious}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card-bg text-foreground shadow-lg transition-all hover:border-accent hover:text-accent hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Previous project"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Project title and link to project page */}
              <div className="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
                <Link
                  href={`/projects/${encodeURIComponent(selectedProject.slug)}`}
                  className="group inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-button focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0 font-heading text-body md:text-h3 font-bold text-foreground transition-colors group-hover:text-accent text-center break-words line-clamp-2">
                    {selectedProject.name}
                  </span>
                  {(selectedYearText ?? selectedDateText) && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-body text-body font-medium text-accent">
                      ● {selectedYearText ?? selectedDateText}
                    </span>
                  )}
                </Link>
                {/* TODO(summary below the name: GET /api/projects does not send `summary` yet; needs the lead's approval to add it to ProjectCard) */}
              </div>

              {/* Next button */}
              <button
                type="button"
                onClick={selectNext}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card-bg text-foreground shadow-lg transition-all hover:border-accent hover:text-accent hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Next project"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
