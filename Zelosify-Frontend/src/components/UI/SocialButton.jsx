import React from "react"
import { motion } from "framer-motion"

const SocialButton = React.memo(({ icon: Icon, onClick, label }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border/70 rounded-lg text-sm font-medium text-foreground hover:bg-white/[0.04] bg-card transition-colors duration-200"
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </motion.button>
))

SocialButton.displayName = "SocialButton"
export default SocialButton

