import { count, countDistinct, desc, eq, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "~/db/schema";
import {
  CourseStatus,
  categories,
  courses,
  lessons,
  modules,
  users,
} from "~/db/schema";

// ─── Landing ───
// What the landing page shows: the newest published courses and a few
// figures about the published catalogue (see ADR-0014).

export type Db = BetterSQLite3Database<typeof schema>;

const FEATURED_COURSE_LIMIT = 3;

export type FeaturedCourse = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  instructorName: string;
  categoryName: string;
  lessonCount: number;
};

export type CatalogueStats = {
  courses: number;
  categories: number;
  lessons: number;
  instructors: number;
};

export type Landing = {
  featuredCourses: FeaturedCourse[];
  stats: CatalogueStats;
};

const isPublished = eq(courses.status, CourseStatus.Published);

function getFeaturedCourses(db: Db): FeaturedCourse[] {
  const rows = db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      coverImageUrl: courses.coverImageUrl,
      instructorName: users.name,
      categoryName: categories.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .where(isPublished)
    .orderBy(desc(courses.createdAt), desc(courses.id))
    .limit(FEATURED_COURSE_LIMIT)
    .all();

  const lessonCounts = getLessonCounts(
    db,
    rows.map((row) => row.id)
  );
  return rows.map((row) => ({
    ...row,
    lessonCount: lessonCounts.get(row.id) ?? 0,
  }));
}

function getLessonCounts(db: Db, courseIds: number[]): Map<number, number> {
  const rows = db
    .select({ courseId: modules.courseId, lessonCount: count(lessons.id) })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId)
    .all();
  return new Map(rows.map((row) => [row.courseId, row.lessonCount]));
}

function getCatalogueStats(db: Db): CatalogueStats {
  const catalogue = db
    .select({
      courses: count(courses.id),
      instructors: countDistinct(courses.instructorId),
      categories: countDistinct(courses.categoryId),
    })
    .from(courses)
    .where(isPublished)
    .get();
  const lessonTotal = db
    .select({ lessons: count(lessons.id) })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(isPublished)
    .get();

  return {
    courses: catalogue?.courses ?? 0,
    instructors: catalogue?.instructors ?? 0,
    lessons: lessonTotal?.lessons ?? 0,
    categories: catalogue?.categories ?? 0,
  };
}

export function getLanding(db: Db): Landing {
  return {
    featuredCourses: getFeaturedCourses(db),
    stats: getCatalogueStats(db),
  };
}
