import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"

interface InfoCardProps {
    title: string
    icon: LucideIcon
    content: React.ReactNode
    isLoading?: boolean
    loadingContent?: React.ReactNode
}

export function InfoCard({ title, icon: Icon, content, isLoading = false, loadingContent }: InfoCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    loadingContent || <Skeleton className="h-8 w-3/4" />
                ) : (
                    content
                )}
            </CardContent>
        </Card>
    )
}
