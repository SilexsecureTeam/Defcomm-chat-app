import React from "react";
import { motion } from "framer-motion";

const LoaderCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      className="flex items-center gap-4 bg-zinc-900 text-white rounded-xl p-4 shadow-sm my-2 border border-zinc-800"
    >
      <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-700 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-zinc-700 rounded w-1/2 animate-pulse" />
        <div className="flex gap-2 mt-1">
          <div className="h-6 w-16 rounded bg-zinc-700 animate-pulse" />
          <div className="h-6 w-16 rounded bg-zinc-700 animate-pulse" />
        </div>
      </div>
      <div className="w-6 h-6 rounded-full bg-zinc-700 animate-pulse" />
    </motion.div>
  );
};

export default LoaderCard;
