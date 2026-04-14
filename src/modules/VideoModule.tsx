import { getVideoType } from '../utils/sourceHelpers';

interface VideoModuleProps {
  src: string;
}

export function VideoModule({ src }: VideoModuleProps) {
  const videoType = getVideoType(src);

  return (
    <video
      className="h-full w-full cursor-pointer"
      controls
      muted
      autoPlay
      loop
      key={src}
    >
      <source src={src} type={videoType} />
    </video>
  );
}
