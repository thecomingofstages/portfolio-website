"use client";

import { useEffect, useRef, useState } from "react";
import type { TeamBlock } from "@/types/api";

type TeamProps = {
  block?: TeamBlock;
};

type ProjectItem = {
  id: string;
  title: string;
  description: string;
};

type MemberItem = {
  id: string;
  name: string;
  role: string;
};

type TrackItem = {
  key: string;
  badge: string;
  name: string;
  desc: string;
  projects: ProjectItem[];
  members: MemberItem[];
};

const DEFAULT_TRACKS: TrackItem[] = [
  {
    key: "it",
    badge: "TECH",
    name: "IT",
    desc: "ดูแลระบบเทคโนโลยี เว็บไซต์ และงานดิจิทัล",
    projects: [
      { id: "p1", title: "Ticketing & Portfolio Website", description: "อธิบายโปรเจกต์" },
      { id: "p2", title: "Live Streaming & Stage Display", description: "อธิบายโปรเจกต์" },
    ],
    members: [
      { id: "m1", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Frontend Developer" },
      { id: "m2", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Backend & System Architect" },
      { id: "m3", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: UI/UX & Stage Technician" },
    ],
  },
  {
    key: "documentary",
    badge: "MEDIA",
    name: "Documentary",
    desc: "บันทึกเรื่องราวและเบื้องหลังการทำงาน",
    projects: [
      { id: "p1", title: "Behind The Scenes Documentary", description: "อธิบายโปรเจกต์" },
      { id: "p2", title: "Cast & Crew Special Interview", description: "อธิบายโปรเจกต์" },
    ],
    members: [
      { id: "m1", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Director & Cinematographer" },
      { id: "m2", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Video Editor & Colorist" },
      { id: "m3", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Sound Recordist" },
    ],
  },
  {
    key: "finance",
    badge: "MANAGEMENT",
    name: "Finance",
    desc: "บริหารจัดการงบประมาณและการเงิน",
    projects: [
      { id: "p1", title: "Budget Planning & Cost Control", description: "อธิบายโปรเจกต์" },
      { id: "p2", title: "Sponsorship & Financial Report", description: "อธิบายโปรเจกต์" },
    ],
    members: [
      { id: "m1", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Financial Controller" },
      { id: "m2", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Purchasing & Accounting" },
      { id: "m3", name: "ชื่อ-นามสกุล (ชื่อเล่น)", role: "หน้าที่: Budget Auditor" },
    ],
  },
];

/** Scroll reveal: fade in on scroll down, fade out on scroll up */
function ScrollReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Default to visible if running without IntersectionObserver (e.g., SSR or unsupported environments)
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Team({ block }: TeamProps) {
  const [selectedTrack, setSelectedTrack] = useState<TrackItem | null>(null);

  // Close popup with Esc key & lock body scroll when popup is open
  useEffect(() => {
    if (!selectedTrack) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTrack(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedTrack]);

  const hasCustomDepts = Boolean(block?.departments && block.departments.length > 0);

  const tracks: TrackItem[] = hasCustomDepts
    ? block!.departments.map((dept, index) => ({
        key: dept.dept_key,
        badge: `TRACK 0${index + 1}`,
        name: dept.dept_name || dept.dept_key,
        desc:
          dept.members && dept.members.length > 0
            ? dept.members.map((m) => m.name).join(", ")
            : "ฝ่ายงานในโปรเจกต์",
        projects: [
          { id: "p1", title: "ผลงานประจำฝ่าย", description: "อธิบายโปรเจกต์" },
          { id: "p2", title: "ผลงานพิเศษ", description: "อธิบายโปรเจกต์" },
        ],
        members:
          dept.members && dept.members.length > 0
            ? dept.members.map((m, mIdx) => ({
                id: `m-${mIdx}`,
                name: m.name,
                role: `หน้าที่: ${m.position || "สมาชิกในฝ่าย"}`,
              }))
            : [
                { id: "m1", name: "ชื่อ-นามสกุล", role: "หน้าที่: ผู้ประสานงานฝ่าย" },
                { id: "m2", name: "ชื่อ-นามสกุล", role: "หน้าที่: ผู้ปฏิบัติงาน" },
              ],
      }))
    : DEFAULT_TRACKS;

  const title = block?.title || "Tracks (สายงาน)";

  return (
    <>
      {/* 1. Track List Section (Main View - 90% mobile, 80% desktop) */}
      <section className="page-width py-6 md:py-8">
        <div className="mb-5 md:mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-card-bg/70 px-2.5 py-0.5 md:px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-heading text-body font-medium tracking-wider text-accent uppercase">
              TCOS TRACKS
            </span>
          </div>

          <h2 className="font-heading text-h2 font-bold text-foreground">
            {title}
          </h2>

          <p className="mt-1 font-body text-body text-muted">
            สายงานของเด็กไทยติดเวทีในการสร้างสรรค์ผลงาน
          </p>
        </div>

        {/* Compact Grid of Track Cards: 1 col on mobile, 2 cols on sm, 3 cols on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {tracks.map((track) => (
            <button
              key={track.key}
              type="button"
              onClick={() => setSelectedTrack(track)}
              className="group relative flex flex-col text-left cursor-pointer rounded-[var(--radius-card)] bg-card-bg/70 p-4 transition-all duration-200 active:scale-[0.99] hover:bg-card-bg focus:outline-none sm:p-5 md:hover:-translate-y-1"
            >
              <span className="font-heading text-body font-medium tracking-wide text-muted">
                {track.badge}
              </span>

              <h3 className="mt-2.5 font-heading text-h3 font-semibold text-foreground transition-colors group-hover:text-accent md:mt-3">
                {track.name}
              </h3>

              <p className="mt-1.5 font-body text-body text-muted">
                {track.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Track Popup (Modal View with Scroll Reveal - Responsive) */}
      {selectedTrack ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6 lg:p-8"
        >
          {/* Backdrop (Dark Overlay 75%) */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTrack(null)}
          />

          {/* Popup Container: 
              - Mobile: bottom sheet style with 92vh height, rounded top, smooth touch scroll
              - Desktop: centered modal max-w-4xl, rounded card, generous padding
          */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-2xl bg-[#121212] p-5 shadow-2xl sm:max-h-[90vh] sm:rounded-[var(--radius-card)] sm:p-8 md:p-10">
            {/* Top Drag / Sheet Indicator for Mobile */}
            <div className="mb-3 flex justify-center sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {/* Navigation & Back Action (Static, moves naturally with content) */}
            <div className="flex items-center justify-between pb-4 md:pb-6">
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                className="group inline-flex items-center gap-2 font-body text-body text-muted transition-colors hover:text-foreground cursor-pointer"
              >
                <span className="font-heading text-body-lg text-accent transition-transform group-hover:-translate-x-1">
                  ←
                </span>
                <span className="font-heading text-body font-medium">Back</span>
              </button>
            </div>

            {/* A. Track Name & Header */}
            <div className="mb-6 md:mb-8">
              <span className="font-heading text-body font-medium tracking-wider text-accent uppercase">
                {selectedTrack.badge}
              </span>
              <h1 className="mt-1 font-heading text-h1 font-bold text-foreground">
                {selectedTrack.name}
              </h1>
              <p className="mt-1.5 font-body text-body text-muted md:mt-2 md:text-body-lg">
                {selectedTrack.desc}
              </p>
            </div>

            {/* B. Main Photo Placeholder (Borderless, Clean Empty Box) */}
            <div className="mb-10 overflow-hidden rounded-[var(--radius-card)] bg-card-bg/60 md:mb-14">
              <div className="aspect-[16/9] w-full md:aspect-[21/9]" />
            </div>

            {/* C. Achievements / ผลงานที่เคยทำ (Scroll Reveal, Borderless) */}
            <ScrollReveal className="mb-10 md:mb-14">
              <h2 className="mb-3 font-heading text-h2 font-bold text-foreground md:mb-4">
                ผลงานที่เคยทำ
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {selectedTrack.projects.map((proj) => (
                  <div key={proj.id} className="flex flex-col">
                    <div className="overflow-hidden rounded-[var(--radius-card)] bg-card-bg/60">
                      <div className="aspect-video w-full" />
                    </div>
                    <h3 className="mt-2.5 font-heading text-h3 font-semibold text-foreground md:mt-3">
                      {proj.title}
                    </h3>
                    <p className="mt-1 font-body text-body text-muted">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* D. Members / สมาชิกในสายงาน (Scroll Reveal, Borderless) */}
            <ScrollReveal className="mb-4">
              <h2 className="mb-3 font-heading text-h2 font-bold text-foreground md:mb-4">
                สมาชิกในสายงาน
              </h2>
              {/* Mobile: 2 cols, Tablet: 2 cols, Desktop: 3 cols */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6">
                {selectedTrack.members.map((member) => (
                  <div key={member.id} className="flex flex-col">
                    <div className="overflow-hidden rounded-[var(--radius-card)] bg-card-bg/60">
                      <div className="aspect-[4/5] w-full" />
                    </div>
                    <h3 className="mt-2 font-heading text-body-lg font-semibold text-foreground md:mt-3">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 font-body text-body text-muted md:mt-1">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      ) : null}
    </>
  );
}
