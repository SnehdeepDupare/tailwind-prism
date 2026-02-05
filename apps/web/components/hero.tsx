"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/constants/site";
import Link from "next/link";
import { IconArrowUpRight, IconCaretDownFilled } from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DOWNLOAD_LINKS } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";

export const Hero = () => {
  const isMobile = useIsMobile();
  return (
    <section className="px-4 pt-20">
      <motion.h1
        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-3xl font-bold tracking-tight text-balance text-neutral-900 text-shadow-sm md:text-5xl"
      >
        Make Tailwind classes readable again.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
        className="text-muted-foreground mt-4 max-w-2xl text-base"
      >
        Semantic syntax highlighting for your Tailwind CSS classes, so you
        don&apos;t get confused again and edit long classes without slowing
        down.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
        className="mt-4 flex flex-col items-center gap-4 sm:flex-row"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="relative w-full gap-2 rounded-md border-0 bg-linear-to-b from-neutral-700 to-neutral-800 px-4 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.5)] transition-all duration-200 ease-in-out hover:shadow-[0_6px_16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.5)] active:scale-[0.98] sm:w-fit"
              size="lg"
            >
              Install Tailwind Prism
              <IconCaretDownFilled className="absolute right-4 size-4 sm:static" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align={isMobile ? "center" : "start"}
            className="p-1 md:w-56"
          >
            <PopoverHeader>
              <PopoverTitle className="sr-only">Install for</PopoverTitle>
              <PopoverDescription className="sr-only">
                Select your editor
              </PopoverDescription>
            </PopoverHeader>

            <div className="flex flex-col">
              {DOWNLOAD_LINKS.map(({ icon: Icon, ...link }) => {
                return (
                  <Button
                    key={link.title}
                    variant="ghost"
                    asChild
                    size="lg"
                    className="justify-start"
                  >
                    <a href={link.url} className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {link.title}
                    </a>
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          asChild
          size="lg"
          variant="secondary"
          className="flex w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2.5 font-semibold text-neutral-700 shadow shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_-2px_0_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-200 ease-in-out hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-md active:scale-[0.98] sm:w-fit"
        >
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
            <IconArrowUpRight />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
};
