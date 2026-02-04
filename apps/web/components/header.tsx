"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/constants/site";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-background sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b px-4"
    >
      <Link href="/">
        <Image
          src="logo-with-text.svg"
          alt="Tailwind Prism Logo"
          width={180}
          height={100}
          className="object-cover"
        />
      </Link>

      <Button
        asChild
        size="lg"
        className="rounded-md border bg-linear-to-b from-neutral-700 to-neutral-800 px-4 py-2.5 shadow-md hover:shadow-lg"
      >
        <Link
          href={siteConfig.links.vscodeMarketplace}
          target="_blank"
          rel="noopener noreferrer"
        >
          Install
        </Link>
      </Button>
    </motion.header>
  );
};
