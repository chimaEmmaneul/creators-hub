import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/StatePanels";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={FileQuestion}
        title="We couldn't find that page"
        description="The video may have been deleted, or the link might be mistyped."
        action={<ButtonLink href="/">Back to dashboard</ButtonLink>}
      />
    </Card>
  );
}
