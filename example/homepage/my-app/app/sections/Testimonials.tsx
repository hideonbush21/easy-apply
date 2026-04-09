"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import FadeInUp from "../components/FadeInUp";

const testimonials = [
  {
    name: "张同学",
    school: "哥伦比亚大学",
    avatar: "张",
    content:
      "EduPath的AI选校功能太强大了！它推荐的冲刺校、匹配校、保底校非常精准，最终我真的拿到了哥大的Offer！",
    rating: 5,
  },
  {
    name: "李同学",
    school: "伦敦政治经济学院",
    avatar: "李",
    content:
      "文书助手帮我节省了大量时间，生成的初稿质量很高，经过简单修改就能直接使用。强烈推荐！",
    rating: 5,
  },
  {
    name: "王同学",
    school: "新加坡国立大学",
    avatar: "王",
    content:
      "申请进度追踪功能让我不再焦虑，每个关键节点都有提醒，整个申请过程井然有序。",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-gray-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
            听听他们怎么说
          </h2>
          <p className="text-lg text-gray-text">来自全球学生的真实反馈</p>
        </FadeInUp>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <FadeInUp key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-secondary leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-secondary">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-primary">
                      录取：{testimonial.school}
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}