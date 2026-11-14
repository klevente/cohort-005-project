import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";

describe("describeNoteDraft", () => {
  it("counts the characters against the limit", () => {
    const draft = describeNoteDraft({ draft: "hello", saved: "", limit: 10 });
    expect(draft.length).toBe(5);
    expect(draft.limit).toBe(10);
  });

  it("is clean when the draft matches what was saved", () => {
    const draft = describeNoteDraft({
      draft: "same",
      saved: "same",
      limit: 10,
    });
    expect(draft.status).toBe("saved");
    expect(draft.canSave).toBe(false);
  });

  it("is unsaved when the draft differs from what was saved", () => {
    const draft = describeNoteDraft({ draft: "new", saved: "old", limit: 10 });
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
  });

  it("starts empty when nothing was saved and nothing is typed", () => {
    const draft = describeNoteDraft({ draft: "", saved: null, limit: 10 });
    expect(draft.status).toBe("empty");
    expect(draft.canSave).toBe(false);
  });

  it("cannot save a draft that is only whitespace", () => {
    const draft = describeNoteDraft({ draft: "   ", saved: null, limit: 10 });
    expect(draft.status).toBe("empty");
    expect(draft.canSave).toBe(false);
  });

  it("treats a missing saved note as different from a typed draft", () => {
    const draft = describeNoteDraft({ draft: "first", saved: null, limit: 10 });
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
  });

  it("allows a draft exactly at the limit", () => {
    const draft = describeNoteDraft({ draft: "abcde", saved: "", limit: 5 });
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses a draft over the limit", () => {
    const draft = describeNoteDraft({ draft: "abcdef", saved: "", limit: 5 });
    expect(draft.tooLong).toBe(true);
    expect(draft.status).toBe("too-long");
    expect(draft.canSave).toBe(false);
  });

  it("reports an over-limit draft as too long even if it matches what was saved", () => {
    const draft = describeNoteDraft({
      draft: "abcdef",
      saved: "abcdef",
      limit: 5,
    });
    expect(draft.status).toBe("too-long");
  });
});
