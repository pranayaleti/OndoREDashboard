import { Check } from "lucide-react"

interface OnboardingChecklistProps {
  title: string
  items: string[]
}

export function OnboardingChecklist({ title, items }: OnboardingChecklistProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{title}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
