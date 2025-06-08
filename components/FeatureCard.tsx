import { Card } from '@/components/ui/card'

interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
  }
  
  export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
      <Card className="p-6 text-center">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </Card>
    )
  }
  