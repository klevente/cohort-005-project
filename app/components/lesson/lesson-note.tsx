import { useState } from "react";
import { useFetcher } from "react-router";
import { MAX_NOTE_LENGTH } from "~/lib/notes";
import {
  describeNoteDraft,
  type NoteDraft,
  type NoteDraftStatus,
} from "~/modules/lesson-notes";
import { LessonSection } from "~/components/lesson-section";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { NotebookPen, Check } from "lucide-react";
import { cn, formatRelativeTime } from "~/lib/utils";

export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const [body, setBody] = useState(note?.body ?? "");
  const draft = describeNoteDraft({
    draft: body,
    saved: note?.body ?? null,
    limit: MAX_NOTE_LENGTH,
  });

  return (
    <LessonSection
      icon={NotebookPen}
      title="Your notes"
      description="Private to you. Jot things down while you watch."
    >
      <fetcher.Form method="post" className="space-y-2">
        <input type="hidden" name="intent" value="save-note" />
        <Textarea
          name="body"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What stood out? What do you want to come back to?"
          aria-label="Your notes"
          className="resize-y"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isSaving || !draft.canSave}>
            {isSaving ? "Saving..." : "Save note"}
          </Button>
          <NoteStatus
            error={error}
            status={draft.status}
            updatedAt={note?.updatedAt}
          />
          <NoteLength draft={draft} />
        </div>
      </fetcher.Form>
    </LessonSection>
  );
}

function NoteLength({ draft }: { draft: NoteDraft }) {
  return (
    <span
      className={cn(
        "ml-auto text-xs",
        draft.tooLong ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {draft.length} / {draft.limit}
    </span>
  );
}

function NoteStatus({
  error,
  status,
  updatedAt,
}: {
  error: string | undefined;
  status: NoteDraftStatus;
  updatedAt: string | undefined;
}) {
  if (error) return <span className="text-xs text-destructive">{error}</span>;
  if (status === "unsaved") {
    return (
      <span className="text-xs text-muted-foreground">Unsaved changes</span>
    );
  }
  if (status === "saved" && updatedAt) {
    return (
      <span
        suppressHydrationWarning
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Check className="size-3" />
        Saved {formatRelativeTime(updatedAt)}
      </span>
    );
  }
  return null;
}
