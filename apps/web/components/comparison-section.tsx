"use client";

import { Compare } from "@/components/compare";
import { motion } from "motion/react";

export const ComparisonSection = () => {
  return (
    <section className="mt-10 px-5">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut", delay: 0.3 }}
        className="flex items-center justify-center rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-4 md:p-6"
      >
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100 p-2 md:p-4">
          <Compare
            firstImage="/before.png"
            secondImage="/after.png"
            firstImageClassName="object-cover object-left-top"
            secondImageClassname="object-cover object-left-top"
            className="h-[250px] w-full md:h-[500px] md:w-full"
            slideMode="hover"
            autoplay
          />
        </div>
      </motion.div>
    </section>
  );
};
