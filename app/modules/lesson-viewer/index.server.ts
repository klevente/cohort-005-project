import { loadLessonPage } from "./lib/load-lesson.server";

export { loadLessonPage } from "./lib/load-lesson.server";
export { runLessonAction } from "./lib/lesson-action.server";

/** Everything the lesson page renders, in either its locked or full view. */
export type LessonPageData = Awaited<ReturnType<typeof loadLessonPage>>;
