"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import AnimatedCounter from "../components/AnimatedCounter";

const stats = [
  { value: 35, suffix: "%", label: "录取概率提升", prefix: "+" },
  { value: 500, suffix: "+", label: "覆盖顶尖院校", prefix: "" },
  { value: 50000, suffix: "+", label: "已生成文书", prefix: "" },
  { value: 92, suffix: "%", label: "申请成功率", prefix: "" },
];

export default function ProductShowcase() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Screenshot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50">
            <Image
              src="/images/dashboard.jpg"
              alt="EduPath Dashboard"
              width={1200}
              height={675}
              className="w-full h-auto"
              priority
            />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="bg-primary-light rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={2}
                />
              </div>
              <div className="text-sm text-gray-text">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}