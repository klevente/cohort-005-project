import { z } from "zod";
import { parseParams } from "~/lib/validation";
import { type CourseRef } from "~/modules/permissions/course-permissions.server";

/**
 * The course named by this route's slug, through this lesson. The
 * permissions module treats a lesson in another course, or a malformed lesson
 * id, as not found.
 */
export function lessonRef(params: {
  slug: string;
  lessonId: string;
}): CourseRef {
  return { slug: params.slug, lessonId: params.lessonId };
}

const lessonParamsSchema = z.object({
  lessonId: z.coerce.number().int().positive(),
});

/**
 * The lesson id as a number. Call it after the permission check, which has
 * already turned a malformed id into a 404.
 */
export function lessonIdOf(params: { lessonId: string }): number {
  return parseParams(params, lessonParamsSchema).lessonId;
}
