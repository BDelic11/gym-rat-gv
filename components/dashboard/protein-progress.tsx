import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProteinProgressProps {
  current: number
  target: number
  className?: string
}

export function ProteinProgress({ current, target, className }: ProteinProgressProps) {
  const percentage = Math.min((current / target) * 100, 100)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Protein Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{current}g</span>
            <span className="text-sm text-muted-foreground">of {target}g</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {target - current > 0 ? `${target - current}g remaining` : "Target reached!"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
