"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import FadeInUp from "../components/FadeInUp";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] animate-gradient-shift" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInUp className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            准备好开始你的留学之旅了吗？
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">
            加入10,000+学生，用AI让申请更简单
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              免费开始使用
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          <p className="text-sm text-white/80">
            无需信用卡 · 永久免费基础版
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}