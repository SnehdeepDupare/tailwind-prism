"use client";

import { motion } from "motion/react";

export const Hero = () => {
  return (
    <section className="px-5 pt-20">
      <motion.h1
        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-3xl font-bold tracking-tight text-neutral-900 md:text-5xl"
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
        className="mt-4 flex gap-2"
      >
        <button className="bg-primary text-primary-foreground cursor-pointer rounded-md px-4 py-2 text-sm font-medium">
          Install from VS Code Marketplace
        </button>
        <button className="cursor-pointer rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium">
          View on GitHub
        </button>
      </motion.div>
    </section>
  );
};
