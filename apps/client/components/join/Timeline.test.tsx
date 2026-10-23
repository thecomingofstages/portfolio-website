import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tcos2Round5 } from "@/fixtures/shared";
import { formatDate } from "@/lib/dates";
import type { TimelineEvent } from "@/types/api";
import Timeline, { LABELS } from "./Timeline";

const fixtureTimeline: TimelineEvent[] = tcos2Round5.timeline;

describe("Timeline", () => {
  it("renders an event with date (with time), description and location", () => {
    const eventWithTime: TimelineEvent = {
      ...fixtureTimeline[0],
      start_date: "2025-04-28T14:30:00.000Z",
      end_date: "2025-05-01T18:00:00.000Z",
      location: fixtureTimeline[2].location,
    };

    const { container } = render(<Timeline timeline={[eventWithTime]} />);

    expect(screen.getByRole("heading", { level: 3, name: LABELS.heading })).not.toBeNull();
    expect(
      screen.getByText(formatDate(eventWithTime.start_date, eventWithTime.end_date)),
    ).not.toBeNull();
    expect(screen.getByText(eventWithTime.event_name)).not.toBeNull();
    expect(screen.getByText(eventWithTime.event_description!)).not.toBeNull();
    expect(container.querySelector('[data-field="location"]')?.textContent).toBe(
      eventWithTime.location,
    );
  });

  it("renders an event without a time using formatDate", () => {
    const eventWithoutTime: TimelineEvent = {
      ...fixtureTimeline[0],
      start_date: "2025-04-28",
      end_date: null,
      location: fixtureTimeline[2].location,
    };

    render(<Timeline timeline={[eventWithoutTime]} />);

    const expectedDate = formatDate(eventWithoutTime.start_date, eventWithoutTime.end_date);
    expect(screen.getByText(expectedDate)).not.toBeNull();
    expect(screen.getByText(eventWithoutTime.event_name)).not.toBeNull();
  });

  it("shows LABELS.online when location is null", () => {
    const onlineEvent: TimelineEvent = {
      ...fixtureTimeline[0],
      location: null,
    };

    const { container } = render(<Timeline timeline={[onlineEvent]} />);

    const locationEl = container.querySelector('[data-field="location"]');
    expect(locationEl).not.toBeNull();
    expect(locationEl?.textContent).toBe(LABELS.online);
  });

  it("leaves out event_description cleanly when it is null or empty", () => {
    const noDescEvent: TimelineEvent = {
      ...fixtureTimeline[0],
      event_description: null,
      location: fixtureTimeline[2].location,
    };

    const { container, rerender } = render(<Timeline timeline={[noDescEvent]} />);

    expect(screen.getByText(noDescEvent.event_name)).not.toBeNull();
    expect(screen.queryByText(fixtureTimeline[0].event_description!)).toBeNull();
    expect(container.textContent).not.toContain("null");
    expect(container.textContent).not.toContain("undefined");

    rerender(
      <Timeline
        timeline={[
          {
            ...noDescEvent,
            event_description: "   ",
          },
        ]}
      />,
    );

    expect(screen.queryByText(fixtureTimeline[0].event_description!)).toBeNull();
  });

  it("preserves the exact order of events sent by the API without re-sorting", () => {
    const reversedEvents: TimelineEvent[] = [
      fixtureTimeline[2],
      fixtureTimeline[0],
      fixtureTimeline[1],
    ];

    const { container } = render(<Timeline timeline={reversedEvents} />);

    const items = [...container.querySelectorAll("ol > li")];
    expect(items.length).toBe(reversedEvents.length);
    expect(items[0].textContent).toContain(reversedEvents[0].event_name);
    expect(items[1].textContent).toContain(reversedEvents[1].event_name);
    expect(items[2].textContent).toContain(reversedEvents[2].event_name);
  });

  it("renders nothing when timeline is empty or null", () => {
    const { container, rerender } = render(<Timeline timeline={[]} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();

    rerender(<Timeline timeline={null} />);
    expect(container.firstChild).toBeNull();
  });
});
