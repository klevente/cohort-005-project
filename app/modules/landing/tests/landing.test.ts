import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createLanding } from "../index.server";
import { FEATURED_COURSE_LIMIT } from "../index";

let db: TestDb;
let landing: ReturnType<typeof createLanding>;

beforeEach(() => {
  db = createTestDb();
  landing = createLanding(db);
  counter = 0;
});

// ─── Fixtures ───
// The landing module only reads, so rows go in directly. Kept in one place so
// a schema change touches only this block.

let counter = 0;

function addInstructor(name: string) {
  counter += 1;
  return db
    .insert(schema.users)
    .values({
      name,
      email: `user-${counter}@example.com`,
      role: UserRole.Instructor,
    })
    .returning()
    .get();
}

function addCategory(name: string) {
  counter += 1;
  return db
    .insert(schema.categories)
    .values({ name, slug: `category-${counter}` })
    .returning()
    .get();
}

function addCourse(
  title: string,
  opts: {
    instructorId: number;
    categoryId: number;
    status?: CourseStatus;
    createdAt?: string;
  }
) {
  counter += 1;
  return db
    .insert(schema.courses)
    .values({
      title,
      slug: `course-${counter}`,
      description: `About ${title}`,
      salesCopy: markdown(title),
      instructorId: opts.instructorId,
      categoryId: opts.categoryId,
      status: opts.status ?? CourseStatus.Published,
      createdAt: opts.createdAt ?? "2026-01-01T00:00:00.000Z",
    })
    .returning()
    .get();
}

function addLessons(courseId: number, perModule: number[]) {
  perModule.forEach((lessonCount, moduleIndex) => {
    const mod = db
      .insert(schema.modules)
      .values({
        courseId,
        title: `Module ${moduleIndex}`,
        position: moduleIndex,
      })
      .returning()
      .get();
    for (let i = 0; i < lessonCount; i++) {
      db.insert(schema.lessons)
        .values({ moduleId: mod.id, title: `Lesson ${i}`, position: i })
        .run();
    }
  });
}

describe("landing.get", () => {
  it("is empty when there are no published courses", () => {
    const instructor = addInstructor("Ina");
    const category = addCategory("Web");
    addCourse("Draft", {
      instructorId: instructor.id,
      categoryId: category.id,
      status: CourseStatus.Draft,
    });

    expect(landing.get()).toEqual({
      featuredCourses: [],
      stats: { courses: 0, categories: 0, lessons: 0, instructors: 0 },
    });
  });

  it("features the newest published courses, up to the limit", () => {
    const instructor = addInstructor("Ina");
    const category = addCategory("Web");
    const days = ["01", "05", "03", "04", "02"];
    for (const day of days) {
      addCourse(`Course ${day}`, {
        instructorId: instructor.id,
        categoryId: category.id,
        createdAt: `2026-03-${day}T00:00:00.000Z`,
      });
    }
    addCourse("Newest draft", {
      instructorId: instructor.id,
      categoryId: category.id,
      status: CourseStatus.Draft,
      createdAt: "2026-04-01T00:00:00.000Z",
    });

    const titles = landing.get().featuredCourses.map((c) => c.title);
    expect(FEATURED_COURSE_LIMIT).toBe(3);
    expect(titles).toEqual(["Course 05", "Course 04", "Course 03"]);
  });

  it("gives each featured course its instructor, category and lesson count", () => {
    const instructor = addInstructor("Ina Structor");
    const category = addCategory("Web");
    const course = addCourse("Full", {
      instructorId: instructor.id,
      categoryId: category.id,
    });
    addLessons(course.id, [2, 3]);
    addCourse("Empty", {
      instructorId: instructor.id,
      categoryId: category.id,
      createdAt: "2025-01-01T00:00:00.000Z",
    });

    expect(landing.get().featuredCourses).toEqual([
      {
        id: course.id,
        title: "Full",
        slug: course.slug,
        description: "About Full",
        coverImageUrl: null,
        instructorName: "Ina Structor",
        categoryName: "Web",
        lessonCount: 5,
      },
      expect.objectContaining({ title: "Empty", lessonCount: 0 }),
    ]);
  });

  it("counts only the published catalogue", () => {
    const ina = addInstructor("Ina");
    const otto = addInstructor("Otto");
    const drafty = addInstructor("Drafty");
    const web = addCategory("Web");
    const data = addCategory("Data");
    const unused = addCategory("Unused");
    addCategory("Empty");

    const a = addCourse("A", { instructorId: ina.id, categoryId: web.id });
    const b = addCourse("B", { instructorId: ina.id, categoryId: data.id });
    const c = addCourse("C", { instructorId: otto.id, categoryId: web.id });
    const draft = addCourse("Draft", {
      instructorId: drafty.id,
      categoryId: unused.id,
      status: CourseStatus.Draft,
    });
    const archived = addCourse("Archived", {
      instructorId: drafty.id,
      categoryId: unused.id,
      status: CourseStatus.Archived,
    });
    addLessons(a.id, [1, 2]);
    addLessons(b.id, [4]);
    addLessons(c.id, []);
    addLessons(draft.id, [7]);
    addLessons(archived.id, [9]);

    expect(landing.get().stats).toEqual({
      courses: 3,
      categories: 2,
      lessons: 7,
      instructors: 2,
    });
  });
});
