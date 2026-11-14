export type NoteDraftStatus = "empty" | "saved" | "unsaved" | "too-long";

export type NoteDraft = {
  length: number;
  limit: number;
  tooLong: boolean;
  status: NoteDraftStatus;
  canSave: boolean;
};

function statusOf(
  draft: string,
  saved: string | null,
  tooLong: boolean
): NoteDraftStatus {
  if (tooLong) return "too-long";
  if (draft.length === 0) return "empty";
  if (draft === saved) return "saved";
  return "unsaved";
}

/**
 * Where a Student's note editor stands: how long the draft is, whether it
 * differs from the saved note, and whether Save should be offered.
 */
export function describeNoteDraft({
  draft: typed,
  saved,
  limit,
}: {
  draft: string;
  /** The body last saved, or null when the Student has no note yet. */
  saved: string | null;
  limit: number;
}): NoteDraft {
  // The server trims the body before it validates and stores it, so the draft
  // is judged by what would actually be saved.
  const draft = typed.trim();
  const tooLong = draft.length > limit;
  const status = statusOf(draft, saved, tooLong);
  return {
    length: draft.length,
    limit,
    tooLong,
    status,
    canSave: status === "unsaved",
  };
}
