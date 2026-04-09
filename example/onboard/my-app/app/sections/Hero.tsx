"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle } from "lucide-react";

const trustBadges = [
  "永久免费基础版",
  "银行级数据加密",
  "5分钟快速上手",
];

export default function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-white">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl float-animation" style={{ animationDelay: "3s" }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-secondary">
              智能留学申请平台 · 已帮助 10,000+ 学生
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
          >
            <span className="text-secondary">让留学申请</span>
            <br />
            <span className="gradient-text">简单、高效、精准</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-text max-w-2xl mx-auto mb-10"
          >
            从选校到录取，AI助手全程陪伴。基于50万+真实录取数据，科学规划你的申请之路
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 gradient-btn text-white font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
            >
              免费开始使用
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 bg-white text-secondary font-semibold rounded-full border border-border-gray hover:bg-gray-50 transition-colors"
            >
              <Play className="w-5 h-5 text-primary" />
              了解更多
            </motion.button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-text">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{badge}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}