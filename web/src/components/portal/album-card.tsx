import Link from "next/link";
import { ImageIcon, Images } from "lucide-react";
import { mediaSrc, type AlbumSummary } from "@/lib/content";

export function AlbumCard({ album }: { album: AlbumSummary }) {
  return (
    <Link
      href={`/thu-vien/${album.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaSrc(album.coverUrl)}
            alt={album.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="size-10" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
          <Images className="size-3" /> {album.mediaCount}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold">{album.title}</h3>
        {album.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {album.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
