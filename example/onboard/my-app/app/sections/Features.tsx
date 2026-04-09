"use client";

import { motion } from "framer-motion";
import { MapPin, FileText, FolderOpen, Calendar } from "lucide-react";
import FadeInUp from "../components/FadeInUp";

const features = [
  {
    icon: MapPin,
    title: "智能选校推荐",
    description:
      "AI驱动的精准选校系统，分析你的学术背景、标化成绩、活动经历，结合50万+历史录取数据，生成个性化院校推荐列表。",
  },
  {
    icon: FileText,
    title: "AI文书助手",
    description:
      "智能文书生成与优化，根据院校要求和个人背景，生成高质量申请文书。支持PS、推荐信、简历等多种文书类型。",
  },
  {
    icon: FolderOpen,
    title: "申请材料管理",
    description:
      "所有申请资料集中管理，智能分类归档。简历、成绩单、推荐信、文书等材料一目了然，一键导出打包。",
  },
  {
    icon: Calendar,
    title: "申请进度追踪",
    description:
      "可视化申请时间线，关键节点智能提醒。从准备材料到提交申请，每个步骤清晰可见，不再错过截止日期。",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
            四大核心功能，全方位助力申请
          </h2>
          <p className="text-lg text-gray-text max-w-2xl mx-auto">
            从选校规划到文书撰写，从材料管理到进度追踪，一站式解决所有申请难题
          </p>
        </FadeInUp>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FadeInUp key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="group bg-white border border-border-gray rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300"
                >
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-secondary mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-text leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}