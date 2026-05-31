'use client'

export function VideoPlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
