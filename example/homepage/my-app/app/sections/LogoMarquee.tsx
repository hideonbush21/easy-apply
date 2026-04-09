"use client";

import { motion } from "framer-motion";
import FadeInUp from "../components/FadeInUp";

const universities = [
  { name: "哈佛大学", abbr: "Harvard" },
  { name: "斯坦福大学", abbr: "Stanford" },
  { name: "麻省理工", abbr: "MIT" },
  { name: "哥伦比亚", abbr: "Columbia" },
  { name: "牛津大学", abbr: "Oxford" },
  { name: "剑桥大学", abbr: "Cambridge" },
  { name: "帝国理工", abbr: "Imperial" },
  { name: "伦敦政经", abbr: "LSE" },
  { name: "香港大学", abbr: "HKU" },
  { name: "新加坡国立", abbr: "NUS" },
];

export default function LogoMarquee() {
  // Duplicate for seamless loop
  const allUniversities = [...universities, ...universities];

  return (
    <section className="py-16 bg-gray-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <FadeInUp className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-3">
            覆盖全球 500+ 顶尖院校
          </h2>
          <p className="text-gray-text">数据来源官方可靠，持续更新</p>
        </FadeInUp>
      </div>

      {/* Logo Marquee */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-bg to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-bg to-transparent z-10" />

        <div className="logo-marquee flex gap-8">
          {allUniversities.map((uni, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{uni.abbr.slice(0, 2)}</span>
              </div>
              <span className="text-sm font-medium text-secondary whitespace-nowrap">
                {uni.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}