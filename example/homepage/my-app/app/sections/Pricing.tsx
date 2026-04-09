"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import FadeInUp from "../components/FadeInUp";

const plans = [
  {
    name: "免费版",
    price: "0",
    period: "月",
    description: "适合初次体验的用户",
    features: [
      "基础选校评估",
      "3所院校推荐",
      "文书模板下载",
      "邮件支持",
    ],
    cta: "免费开始",
    highlighted: false,
  },
  {
    name: "专业版",
    price: "99",
    period: "月",
    description: "适合认真申请的学生",
    features: [
      "高级选校算法",
      "无限院校推荐",
      "AI文书助手",
      "材料管理系统",
      "进度追踪",
      "优先客服支持",
    ],
    cta: "立即升级",
    highlighted: true,
    badge: "最受欢迎",
  },
  {
    name: "旗舰版",
    price: "199",
    period: "月",
    description: "追求极致申请体验",
    features: [
      "全部专业版功能",
      "1对1顾问咨询",
      "文书精修服务",
      "面试辅导",
      "专属申请策略",
      "VIP客服通道",
    ],
    cta: "联系销售",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
            选择适合你的方案
          </h2>
          <p className="text-lg text-gray-text">
            从免费基础版到专业版，满足不同需求
          </p>
        </FadeInUp>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <FadeInUp key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-white border-2 border-primary shadow-xl shadow-primary/10 scale-105"
                    : "bg-white border border-border-gray hover:shadow-lg"
                } transition-all duration-300`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-secondary mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-text mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-lg text-gray-text">¥</span>
                    <span className="text-4xl font-bold text-secondary">
                      {plan.price}
                    </span>
                    <span className="text-gray-text">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center gap-3 text-sm text-gray-text"
                    >
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? "gradient-btn text-white shadow-lg shadow-primary/25"
                      : "bg-gray-bg text-secondary hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}