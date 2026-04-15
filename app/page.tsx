import { Suspense } from "react"
import TrackingPage from "@/components/tracking-page"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <TrackingPage />
    </Suspense>
  )
}
