"use client";

import { motion } from "framer-motion";
import { UserPlus, Target, Rocket } from "lucide-react";
import FadeInUp from "../components/FadeInUp";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "快速注册评估",
    description: "填写基本学术背景，AI即刻为你生成初步评估报告和选校建议",
  },
  {
    icon: Target,
    step: "02",
    title: "制定申请策略",
    description: "根据评估结果，获取个性化申请方案，包括选校清单、时间规划、文书策略",
  },
  {
    icon: Rocket,
    step: "03",
    title: "高效执行申请",
    description: "使用AI工具完成文书撰写，管理申请材料，追踪申请进度直至收获Offer",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-primary-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
            三步开启申请之旅
          </h2>
          <p className="text-lg text-gray-text">简单上手，快速开始</p>
        </FadeInUp>

        {/* Steps */}
        <div className="relative">
          {/* Connection line (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-primary/20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <FadeInUp key={index} delay={index * 0.15}>
                <div className="relative text-center">
                  {/* Step Number & Icon */}
                  <div className="relative inline-flex flex-col items-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4"
                    >
                      <step.icon className="w-10 h-10 text-primary" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-secondary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-text leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>

        {/* CTA */}
        <FadeInUp delay={0.5} className="text-center mt-16">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 gradient-btn text-white font-semibold rounded-full shadow-lg shadow-primary/25"
          >
            立即开始体验
          </motion.button>
        </FadeInUp>
      </div>
    </section>
  );
}