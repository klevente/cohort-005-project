import { Link } from "react-router";
import { ArrowRight, BookOpen, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CourseImage } from "~/components/course-image";
import type { FeaturedCourse } from "~/modules/landing";

export function LandingHero({
  spotlight,
  signedIn,
}: {
  spotlight: FeaturedCourse | undefined;
  signedIn: boolean;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-[at_top_right] from-primary/10 to-transparent to-60%"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Courses for developers
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Learn to code,
            <br />
            <span className="text-muted-foreground">at your own pace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Structured courses built by experienced instructors. Track your
            progress, take quizzes, and build real-world skills.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/courses">
                Browse Courses
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              {signedIn ? (
                <Link to="/dashboard">Go to your dashboard</Link>
              ) : (
                <Link to="/signup">Create a free account</Link>
              )}
            </Button>
          </div>
        </div>
        {spotlight && <Spotlight course={spotlight} />}
      </div>
    </section>
  );
}

function Spotlight({ course }: { course: FeaturedCourse }) {
  return (
    <div className="relative hidden lg:block">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-6 translate-y-6 rotate-3 rounded-2xl border border-border bg-muted/60"
      />
      <Link
        to={`/courses/${course.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-transform hover:-translate-y-1"
      >
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Newest · {course.categoryName}
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h2>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-4" />
              {course.instructorName}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {course.lessonCount} lessons
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
