import { CONTENT_STATUS_META } from "@/lib/status-meta";
import { formatDateTime } from "@/lib/format";
import type { ContentItem } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ContentStatusBadge({ item }: { item: Pick<ContentItem, "status" | "scheduledAt"> }) {
  const meta = CONTENT_STATUS_META[item.status];
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <StatusBadge label={meta.label} tone={meta.tone} />
      {item.status === "SCHEDULED" && item.scheduledAt && (
        <span className="text-xs text-muted">
          <span className="sr-only">Goes live </span>
          {formatDateTime(item.scheduledAt)}
        </span>
      )}
    </span>
  );
}
