import Image from "next/image";
import React from "react";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between border-b px-5">
      <Link href="/">
        <Image
          src="logo-with-text.svg"
          alt="Tailwind Prism Logo"
          width={180}
          height={100}
          className="object-cover"
        />
      </Link>

      <button className="bg-primary text-primary-foreground cursor-pointer rounded-md px-4 py-2 text-sm font-medium">
        Download
      </button>
    </header>
  );
};
