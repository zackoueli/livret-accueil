"use client";

import Image from "next/image";

interface Props {
  height?: number;
  variant?: "full" | "icon";
  className?: string;
}

export function BunklyLogo({ height = 32, variant = "full", className = "" }: Props) {
  if (variant === "icon") {
    return (
      <span className={className}>
        <Image src="/icon.png" alt="Bunkly" width={height} height={height} style={{ borderRadius: 8, display: "block" }} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/Logo.png"
        alt="Bunkly"
        height={height}
        width={0}
        sizes="100vw"
        style={{ height, width: "auto", display: "block" }}
      />
    </span>
  );
}
