"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/constants/site";
import { IconBrandGithub, IconBrandX } from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="flex items-center justify-between border-t px-5 py-4"
    >
      <div>
        <Link href="/">
          <Image
            src="logo-with-text.svg"
            alt="Tailwind Prism Logo"
            width={180}
            height={100}
            className="object-cover"
          />
        </Link>

        <p className="text-muted-foreground text-base">
          Developed by{" "}
          <Link
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline hover:underline-offset-2"
          >
            Snehdeep Dupare
          </Link>
          .
        </p>
      </div>

      <div className="text-muted-foreground flex items-center">
        <Button asChild variant="ghost" size="icon">
          <Link
            href={siteConfig.links.github}
            className="hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandGithub className="size-5" />
          </Link>
        </Button>

        <Button asChild variant="ghost" size="icon">
          <Link
            href={siteConfig.links.twitter}
            className="hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandX className="size-5" />
          </Link>
        </Button>
      </div>
    </motion.footer>
  );
};
