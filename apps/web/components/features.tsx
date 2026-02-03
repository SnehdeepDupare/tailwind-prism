"use client";

import { motion } from "motion/react";

import { FEATURES } from "@/constants";

export const Features = () => {
  return (
    <section className="mt-14 px-4">
      <motion.h2
        initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
        whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-center text-4xl font-bold"
      >
        Features
      </motion.h2>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {FEATURES.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              delay: index * 0.02,
            }}
            className="rounded-2xl bg-neutral-50 p-4 text-balance shadow-md ring ring-black/10"
          >
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
