import { PageLoader } from "@/components/shared/Spinner";

/** Shown automatically while any dashboard route/server data is loading. */
export default function Loading() {
  return <PageLoader className="min-h-[60vh]" />;
}
