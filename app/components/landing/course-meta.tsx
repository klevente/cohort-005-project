import { BookOpen, User } from "lucide-react";
import type { FeaturedCourse } from "~/modules/landing";

const sizes = {
  sm: { item: "gap-1", icon: "size-3" },
  lg: { item: "gap-1.5", icon: "size-4" },
};

/** A featured course's instructor and lesson count, side by side. */
export function CourseMeta({
  course,
  size,
}: {
  course: FeaturedCourse;
  size: keyof typeof sizes;
}) {
  const { item, icon } = sizes[size];
  return (
    <>
      <span className={`flex items-center ${item}`}>
        <User className={icon} />
        {course.instructorName}
      </span>
      <span className={`flex items-center ${item}`}>
        <BookOpen className={icon} />
        {course.lessonCount} lessons
      </span>
    </>
  );
}
