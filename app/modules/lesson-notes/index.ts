import { noteDraft, type NoteDraft } from "./lib/note-draft";

export type { NoteDraft, NoteDraftStatus } from "./lib/note-draft";

/**
 * Where a Student's note editor stands: how long the draft is, whether it
 * differs from the saved note, and whether Save should be offered.
 */
export function describeNoteDraft({
  draft,
  saved,
  limit,
}: {
  draft: string;
  /** The body last saved, or null when the Student has no note yet. */
  saved: string | null;
  limit: number;
}): NoteDraft {
  return noteDraft(draft, saved, limit);
}
