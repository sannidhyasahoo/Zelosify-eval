"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const MobileMenu = ({ isMenuOpen, closeMenu }) => {
  const menuVariants = {
    closed: { x: "100%", opacity: 0 },
    open: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const linkVariants = {
    closed: { y: 20, opacity: 0 },
    open: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      initial="closed"
      animate={isMenuOpen ? "open" : "closed"}
      variants={menuVariants}
      className="md:hidden fixed inset-0 bg-[#040506]/95 backdrop-blur-2xl flex flex-col items-stretch justify-start p-6 overflow-y-auto z-50 border-l border-[#2f3031]"
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1b1c1e]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#ff6363] flex items-center justify-center font-bold text-black text-xs">
            Z
          </div>
          <span className="font-semibold text-white tracking-tight">Zelosify</span>
        </div>
        <button
          onClick={closeMenu}
          className="p-2 rounded-lg border border-[#2f3031] bg-[#111214] text-[#9c9c9d] hover:text-white hover:bg-white/[0.04] transition-colors"
          aria-label="Close menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <a
          href="#capabilities"
          onClick={closeMenu}
          className="block py-2 text-base font-medium text-[#9c9c9d] hover:text-white transition-colors"
        >
          Capabilities
        </a>
        <a
          href="#workflow"
          onClick={closeMenu}
          className="block py-2 text-base font-medium text-[#9c9c9d] hover:text-white transition-colors"
        >
          Workflow
        </a>
        <a
          href="#security"
          onClick={closeMenu}
          className="block py-2 text-base font-medium text-[#9c9c9d] hover:text-white transition-colors"
        >
          Security
        </a>
      </div>

      <motion.div
        variants={linkVariants}
        transition={{ delay: 0.2 }}
        className="mt-auto pt-6 border-t border-[#1b1c1e] space-y-3"
      >
        <Link
          href="/login"
          className="block w-full py-3 bg-[#e6e6e6] text-[#07080a] hover:bg-white text-sm font-semibold rounded-lg text-center transition-all shadow-sm"
          onClick={closeMenu}
        >
          Sign in
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default MobileMenu;
