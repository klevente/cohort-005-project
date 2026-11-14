import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "~/components/ui/card";

/**
 * The card shell shared by the sections under a lesson (notes, discussion),
 * so they read as one family rather than each inventing its own header.
 */
export function LessonSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="mb-8 gap-0 py-0">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start gap-2">
          <Icon className="mt-1 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
