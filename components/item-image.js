import Image from "next/image";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

function isSupabaseUrl(src) {
  try {
    return SUPABASE_HOST && new URL(src).hostname.endsWith(SUPABASE_HOST);
  } catch {
    return false;
  }
}

export default function ItemImage({ src, alt, width, height, className, fill }) {
  if (isSupabaseUrl(src)) {
    return fill ? (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
      />
    ) : (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
