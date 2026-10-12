import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered components between tests (Vitest runs without globals).
afterEach(cleanup);
