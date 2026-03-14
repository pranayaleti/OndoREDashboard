export default function Loading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}
