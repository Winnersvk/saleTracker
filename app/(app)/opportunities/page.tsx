import { Suspense } from "react";
import OpportunitiesClient from "./OpportunitiesClient";

export default function OpportunitiesPage() {
  return (
    <Suspense>
      <OpportunitiesClient />
    </Suspense>
  );
}
