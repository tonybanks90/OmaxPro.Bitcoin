import React, { createContext, useContext, useState } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'brand.name': 'Omax',
    'nav.trending': 'Trending',
    'nav.walletTracker': 'Wallet Tracker',
    'nav.monitor': 'Monitor',
    'nav.holdings': 'Holdings',
    'nav.earn': 'Earn',
    'nav.points': 'Points',
    'pages.trending.title': 'Trending',
    'pages.trending.subtitle': 'Top token pairs by transaction volume.',
    'pages.trenches.title': 'The Omax',
    'pages.trenches.subtitle': 'Real-time feed of tokens throughout their lifespan.',
    'pages.token.title': 'Token Details',
    'pages.wallet.title': 'Wallet Tracker',
    'wallet.connect': 'Connect Wallet',
    'wallet.connected': 'Wallet Connected',
    'common.trade': 'Trade',
    'common.buy': 'Buy',
    'common.sell': 'Sell',
    'common.price': 'Price',
    'common.marketCap': 'Market Cap',
    'common.volume': 'Volume',
    'common.holders': 'Holders',
    'common.age': 'Age',
    'columns.newlyCreated': 'Newly Created',
    'columns.aboutToGraduate': 'About to Graduate',
    'columns.graduated': 'Graduated',
    'empty.noWallets': 'No Wallets Found!',
    'empty.noCoins': 'Oops! No Coins Yet!',
  },
  zh: {
    'brand.name': 'Omax',
    'nav.trending': '趋势',
    'nav.walletTracker': '钱包追踪',
    'nav.monitor': '监控',
    'nav.holdings': '持仓',
    'nav.earn': '赚取',
    'nav.points': '积分',
    'pages.trending.title': '趋势',
    'pages.trending.subtitle': '按交易量排序的热门代币对。',
    'pages.trenches.title': 'Omax平台',
    'pages.trenches.subtitle': '代币生命周期的实时动态。',
    'pages.token.title': '代币详情',
    'pages.wallet.title': '钱包追踪器',
    'wallet.connect': '连接钱包',
    'wallet.connected': '钱包已连接',
    'common.trade': '交易',
    'common.buy': '买入',
    'common.sell': '卖出',
    'common.price': '价格',
    'common.marketCap': '市值',
    'common.volume': '交易量',
    'common.holders': '持有者',
    'common.age': '代币年龄',
    'columns.newlyCreated': '新创建',
    'columns.aboutToGraduate': '即将毕业',
    'columns.graduated': '已毕业',
    'empty.noWallets': '未找到钱包！',
    'empty.noCoins': '哎呀！还没有代币！',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('omax-language');
    return (stored as Language) || 'en';
  });

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('omax-language', newLang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
