import Link from "next/link";
import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-time";
import { resolveImageUrl, type PostRecord } from "@/lib/content";

export function PostCard({
  post,
  categoryName,
}: {
  post: PostRecord;
  categoryName?: string;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link href={`/tin-tuc/${post.slug}`} className="block">
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          {post.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(post.thumbnailUrl)}
              alt={post.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground/40">
              Nguyễn Trí
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {categoryName ? (
            <Badge variant="secondary" className="text-[11px]">
              {categoryName}
            </Badge>
          ) : null}
          {post.isPinned ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Pin className="size-3" /> Nổi bật
            </span>
          ) : null}
          <span className="ml-auto">
            {post.publishedAt ? formatDate(post.publishedAt) : ""}
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug">
          <Link href={`/tin-tuc/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        {post.summary ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {post.summary}
          </p>
        ) : null}
      </div>
    </article>
  );
}
