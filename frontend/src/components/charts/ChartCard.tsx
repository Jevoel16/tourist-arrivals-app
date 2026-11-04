import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Height class for the plot area; the header sits outside it so charts never overflow. */
  height?: string;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, description, icon, action, height = "h-72", className, children }: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title={title} description={description} icon={icon} action={action} />
      <div className={cn("w-full px-2 pb-3 pt-4 sm:px-4", height)}>{children}</div>
    </Card>
  );
}
