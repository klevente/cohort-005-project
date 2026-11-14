import { describe, it, expect } from "vitest";
import { runLessonAction } from "../index.server";

const now = new Date("2026-01-01T00:00:00Z");
const params = { slug: "introduction-to-typescript", lessonId: "18" };

function post(fields: Record<string, string>) {
  return new Request("http://localhost/courses/x/lessons/18", {
    method: "POST",
    body: new URLSearchParams(fields),
  });
}

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (thrown) {
    return (thrown as { init?: { status?: number } }).init?.status;
  }
  throw new Error("expected the action to throw");
}

describe("runLessonAction", () => {
  it("rejects a post with no intent as a bad request", async () => {
    expect(
      await statusOf(runLessonAction({ params, request: post({}), now }))
    ).toBe(400);
  });

  it("rejects an intent it does not know as a bad request", async () => {
    const request = post({ intent: "delete-course" });
    expect(await statusOf(runLessonAction({ params, request, now }))).toBe(400);
  });
});
