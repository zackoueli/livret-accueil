"use client";

import Image from "next/image";

interface Props {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
}

export function BunklyLogo({ size = 32, variant = "full", className = "" }: Props) {
  const icon = (
    <Image src="/icon.png" alt="Bunkly" width={size} height={size} style={{ borderRadius: 8 }} />
  );

  if (variant === "icon") return <span className={className}>{icon}</span>;

  return (
    <span className={`inline-flex items-center gap-2 font-bold text-gray-900 ${className}`}>
      <Image src="/Logo.png" alt="Bunkly" width={size * 3.5} height={size} style={{ objectFit: "contain" }} />
    </span>
  );
}
