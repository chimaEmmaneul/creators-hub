import Image from "next/image";
import { clsx } from "clsx";
import { Film } from "lucide-react";

interface ThumbnailProps {
  src: string | null;
  alt?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}

export function Thumbnail({ src, alt = "", className, sizes, priority }: ThumbnailProps) {
  return (
    <div className={clsx("relative aspect-video overflow-hidden rounded-lg bg-subtle", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={src.startsWith("data:")} className="object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-muted" aria-hidden="true">
          <Film className="size-1/3 max-h-8 max-w-8" />
        </div>
      )}
    </div>
  );
}
