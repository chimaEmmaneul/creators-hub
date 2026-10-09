import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/StatePanels";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-md">
        <EmptyState
          icon={FileQuestion}
          title="We couldn't find that page"
          description="The link might be mistyped, or the page may have moved."
          action={<ButtonLink href="/">Go to CreatorHub Studio</ButtonLink>}
        />
      </Card>
    </main>
  );
}
