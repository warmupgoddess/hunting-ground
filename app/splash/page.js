"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const images = ["/splash-1.png", "/splash-2.png", "/splash-3.png"];

function pickRandom() {
  return images[Math.floor(Math.random() * images.length)];
}

export default function Splash() {
  const router = useRouter();
  const [image] = useState(pickRandom);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2500);
    const t2 = setTimeout(() => router.replace("/"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  return (
    <div
      className="fixed top-0 left-0 z-50 overflow-hidden"
      style={{
        width: "100vw",
        height: "100dvh",
        backgroundColor: "#2a2318",
      }}
    >
      <img
        src={image}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: fadeOut ? 0 : 1 }}
      />
    </div>
  );
}
