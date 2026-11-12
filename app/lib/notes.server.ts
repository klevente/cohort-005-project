import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { courses, lessons, modules, notes } from "~/db/schema";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

// ─── Notes ───
// A Student's own plain-text writing about a Lesson, private to that Student.
// One per Student per Lesson, enforced by the unique index on
// (user_id, lesson_id). Only the owning Student's Lesson page and Saved page
// read Note bodies. See GLOSSARY.md.
//
// Every function takes the database first, so tests can hand in an in-memory
// one.

export type Db = BetterSQLite3Database<typeof schema>;

export type LessonNote = { body: string; updatedAt: string };

export type SavedNote = LessonNote & {
  id: number;
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  courseSlug: string;
};

export type SaveNoteResult =
  | { ok: true; note: LessonNote }
  | { ok: false; error: string };

export function getNote(
  db: Db,
  userId: number,
  lessonId: number
): LessonNote | undefined {
  return db
    .select({ body: notes.body, updatedAt: notes.updatedAt })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .get();
}

/**
 * Creates the Student's Note on the Lesson, or replaces the body of the one
 * they already have. Either way `updatedAt` becomes `now`; `createdAt` is kept
 * on a re-save. The body is trimmed, and an empty or over-long body is refused.
 */
export function saveNote(
  db: Db,
  userId: number,
  lessonId: number,
  body: string,
  now: Date
): SaveNoteResult {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Write something before saving your note." };
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `A note can be at most ${MAX_NOTE_LENGTH.toLocaleString("en-US")} characters.`,
    };
  }

  const timestamp = now.toISOString();
  const saved = db
    .insert(notes)
    .values({
      userId,
      lessonId,
      body: trimmed,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: [notes.userId, notes.lessonId],
      set: { body: trimmed, updatedAt: timestamp },
    })
    .returning({ body: notes.body, updatedAt: notes.updatedAt })
    .get();

  return { ok: true, note: saved };
}

/** The Student's Notes, last edited first, each with its Lesson and Course. */
export function listNotes(db: Db, userId: number): SavedNote[] {
  return db
    .select({
      id: notes.id,
      body: notes.body,
      updatedAt: notes.updatedAt,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(notes)
    .innerJoin(lessons, eq(notes.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.id))
    .all();
}
