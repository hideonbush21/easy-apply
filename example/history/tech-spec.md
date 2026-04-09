# 技术规范文档 - EduPath留学申请平台

## 1. 组件清单

### shadcn/ui 组件
- `button` - 按钮组件
- `card` - 卡片组件
- `badge` - 标签组件
- `separator` - 分割线

### 自定义组件
- `Navbar` - 导航栏 (固定顶部，滚动效果)
- `Hero` - Hero区域 (入场动画)
- `ProductShowcase` - 产品展示 (Dashboard截图 + 统计)
- `LogoMarquee` - Logo无限滚动
- `FeatureCard` - 功能卡片 (悬停效果)
- `StepCard` - 步骤卡片 (流程展示)
- `PricingCard` - 定价卡片
- `TestimonialCard` - 评价卡片
- `CTASection` - CTA区域
- `Footer` - 页脚
- `AnimatedCounter` - 数字滚动动画
- `FadeInUp` - 滚动触发动画包装器

## 2. 动画实现方案

| 动画效果 | 实现库 | 实现方式 | 复杂度 |
|---------|-------|---------|-------|
| Hero入场动画 | Framer Motion | `motion.div` + `initial/animate` | 中 |
| 滚动触发显示 | Framer Motion | `whileInView` + `viewport` | 中 |
| 数字滚动计数 | Framer Motion | `useMotionValue` + `useTransform` | 高 |
| Logo无限滚动 | CSS Animation | `@keyframes` + `infinite` | 低 |
| 卡片悬停效果 | Framer Motion | `whileHover` | 低 |
| 按钮悬停效果 | Tailwind CSS | `hover:scale-105` | 低 |
| 装饰元素浮动 | CSS Animation | `@keyframes float` | 低 |
| 渐变背景流动 | CSS Animation | `@keyframes gradient-shift` | 低 |

## 3. 动画库选择

**主要库: Framer Motion**
- 原因: React生态最佳动画库，API简洁，性能优秀
- 用途: 入场动画、滚动触发、悬停效果、数字动画

**辅助: CSS Animations**
- 用途: 无限滚动、简单悬停、背景动画
- 原因: 性能更好，无需JS计算

## 4. 项目文件结构

```
app/
├── sections/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── ProductShowcase.tsx
│   ├── LogoMarquee.tsx
│   ├── Features.tsx
│   ├── HowItWorks.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   ├── CTASection.tsx
│   └── Footer.tsx
├── components/
│   ├── FadeInUp.tsx
│   ├── AnimatedCounter.tsx
│   ├── FeatureCard.tsx
│   ├── StepCard.tsx
│   ├── PricingCard.tsx
│   └── TestimonialCard.tsx
├── page.tsx
├── layout.tsx
└── globals.css
components/ui/
├── button.tsx
├── card.tsx
├── badge.tsx
└── separator.tsx
public/
├── images/
│   └── dashboard.jpg
```

## 5. 依赖安装

```bash
# shadcn组件
npx shadcn add button card badge separator

# 动画库
npm install framer-motion

# 图标库
npm install lucide-react
```

## 6. 响应式断点

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 7. 性能优化

- 使用 `will-change` 优化动画元素
- 图片使用 Next.js Image 组件优化
- 支持 `prefers-reduced-motion`
- 懒加载非首屏内容
