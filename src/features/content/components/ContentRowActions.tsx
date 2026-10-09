"use client";

import { Eye, Pencil, Rocket, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { ContentItem } from "@/types";
import type { ContentActions } from "../hooks/use-content-actions";

export function ContentRowActions({ item, actions }: { item: ContentItem; actions: ContentActions }) {
  const publishing = actions.publishingId === item.id;
  return (
    <div className="flex items-center justify-end gap-1">
      {item.status === "DRAFT" && (
        <Button variant="secondary" size="sm" onClick={() => actions.publish(item)} loading={publishing} aria-label={`Publish ${item.title}`}>
          {!publishing && <Rocket className="size-4" aria-hidden="true" />}
          Publish
        </Button>
      )}
      <ButtonLink href={`/content/${item.id}`} variant="ghost" size="icon" aria-label={`View ${item.title}`} title="View">
        <Eye className="size-4" aria-hidden="true" />
      </ButtonLink>
      <ButtonLink href={`/content/${item.id}/edit`} variant="ghost" size="icon" aria-label={`Edit ${item.title}`} title="Edit">
        <Pencil className="size-4" aria-hidden="true" />
      </ButtonLink>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-danger-soft hover:text-danger"
        onClick={() => actions.requestDelete(item)}
        aria-label={`Delete ${item.title}`}
        aria-haspopup="dialog"
        title="Delete"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
