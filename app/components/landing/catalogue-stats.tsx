import type { LucideIcon } from "lucide-react";
import { BookOpen, GraduationCap, Layers, PlayCircle } from "lucide-react";
import type { CatalogueStats as Stats } from "~/modules/landing";

export function CatalogueStats({ stats }: { stats: Stats }) {
  const items: { icon: LucideIcon; value: number; label: string }[] = [
    { icon: BookOpen, value: stats.courses, label: "Courses" },
    { icon: PlayCircle, value: stats.lessons, label: "Lessons" },
    { icon: GraduationCap, value: stats.instructors, label: "Instructors" },
    { icon: Layers, value: stats.categories, label: "Topics" },
  ];

  return (
    <section className="border-y border-border bg-muted/50">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 px-6 sm:grid-cols-4">
        {items.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-center gap-4 border-border py-8 sm:border-l sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <dd className="text-3xl font-bold tracking-tight">{value}</dd>
              <dt className="text-sm text-muted-foreground">{label}</dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
