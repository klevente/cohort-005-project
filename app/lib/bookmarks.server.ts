import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { bookmarks, courses, lessons, modules } from "~/db/schema";

// ─── Bookmarks ───
// A Student's flag on a Lesson. One per Student per Lesson, enforced by the
// unique index on (user_id, lesson_id). See GLOSSARY.md.
//
// Every function takes the database first, so tests can hand in an in-memory
// one.

export type Db = BetterSQLite3Database<typeof schema>;

export type SavedBookmark = {
  id: number;
  createdAt: string;
  lessonId: number;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  courseSlug: string;
};

function byStudentAndLesson(userId: number, lessonId: number) {
  return and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId));
}

export function isBookmarked(db: Db, userId: number, lessonId: number) {
  return !!db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(byStudentAndLesson(userId, lessonId))
    .get();
}

/**
 * Removes the Student's Bookmark on the Lesson if there is one, and adds one
 * if there isn't. Returns whether the Lesson is bookmarked afterwards.
 */
export function toggleBookmark(
  db: Db,
  userId: number,
  lessonId: number,
  now: Date
): boolean {
  const removed = db
    .delete(bookmarks)
    .where(byStudentAndLesson(userId, lessonId))
    .returning({ id: bookmarks.id })
    .all();
  if (removed.length > 0) return false;

  db.insert(bookmarks)
    .values({ userId, lessonId, createdAt: now.toISOString() })
    .onConflictDoNothing()
    .run();
  return true;
}

/** The Student's Bookmarks, newest first, each with its Lesson and Course. */
export function listBookmarks(db: Db, userId: number): SavedBookmark[] {
  return db
    .select({
      id: bookmarks.id,
      createdAt: bookmarks.createdAt,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      moduleTitle: modules.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(bookmarks)
    .innerJoin(lessons, eq(bookmarks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .all();
}
