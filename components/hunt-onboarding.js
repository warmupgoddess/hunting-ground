"use client";

import { useState, useEffect } from "react";
import ChatBar from "./chat-bar";

export default function HuntOnboarding({ huntId }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2000);
    const t2 = setTimeout(() => setStep(2), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <p
          className="text-muted text-center transition-opacity duration-[800ms]"
          style={{ fontSize: "18px", fontWeight: 200, opacity: step >= 0 ? 1 : 0 }}
        >
          this is where your hunts live.
        </p>
        <p
          className="text-muted text-center mt-4 transition-opacity duration-[800ms]"
          style={{ fontSize: "18px", fontWeight: 200, opacity: step >= 1 ? 1 : 0 }}
        >
          add an item to consider by pasting a link below.
        </p>
      </div>

      <div
        className="transition-all duration-[800ms]"
        style={{
          opacity: step >= 2 ? 1 : 0,
          pointerEvents: step >= 2 ? "auto" : "none",
        }}
      >
        <ChatBar context="hunt" huntId={huntId} isEmpty />
      </div>
    </>
  );
}
