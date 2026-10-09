import { cache } from "react";
import { notFound } from "next/navigation";
import { getContent } from "@/server/content";
import { DomainError } from "@/server/errors";
import { requireCreator } from "@/server/session";

export const loadContentOrNotFound = cache(async (id: string) => {
  const creator = await requireCreator();
  try {
    return { creator, item: await getContent(creator, id) };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
});
