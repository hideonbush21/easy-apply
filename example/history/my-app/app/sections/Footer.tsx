"use client";

import { motion } from "framer-motion";
import { GraduationCap, Mail, Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";

const productLinks = [
  { href: "#features", label: "功能特性" },
  { href: "#pricing", label: "定价方案" },
  { href: "#how-it-works", label: "使用流程" },
  { href: "#testimonials", label: "用户评价" },
];

const resourceLinks = [
  { href: "#", label: "帮助中心" },
  { href: "#", label: "博客" },
  { href: "#", label: "申请指南" },
  { href: "#", label: "常见问题" },
];

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "Github" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">EduPath</span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              AI驱动的智能留学申请平台，让留学申请更简单、高效、精准。
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">产品</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h4 className="font-semibold mb-4">资源</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">联系我们</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 EduPath. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-primary transition-colors">
              隐私政策
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}