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
  if (draft.trim().length === 0) return "empty";
  if (draft === saved) return "saved";
  return "unsaved";
}

export function noteDraft(
  draft: string,
  saved: string | null,
  limit: number
): NoteDraft {
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
