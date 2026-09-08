import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '厂区打地鼠｜奇瑞工厂趣味游戏',
  description: '敲击从工厂草坪冒出的头像，挑战五连击彩蛋。支持电脑和 iPhone/iPad 浏览器。',
  applicationName: '厂区打地鼠',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '厂区打地鼠',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#d71f2b',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
