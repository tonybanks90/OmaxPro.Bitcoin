import React, { createContext, useContext, useState } from 'react';
import type { Language } from '../types';

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
    'nav.trenches': 'Trenches',
    'nav.holdings': 'Holdings',
    'nav.earn': 'Earn',
    'nav.points': 'Points',
    'nav.sniper': 'Sniper',
    'pages.trending.title': 'Trending',
    'pages.trending.subtitle': 'Top token pairs by transaction volume.',
    'pages.trenches.title': 'The Omax',
    'pages.trenches.subtitle': 'Real-time feed of tokens throughout their lifespan.',
    'pages.token.title': 'Token Details',
    'pages.wallet.title': 'Wallet Tracker',
    'pages.earn.title': 'Earn',
    'pages.holdings.title': 'My Holdings',
    'pages.walletManager.title': 'Wallet Manager',
    'pages.sniper.title': 'Sniper',
    'wallet.connect': 'Connect Wallet',
    'wallet.connected': 'Wallet Connected',
    'wallet.deposit': 'Deposit',
    'wallet.withdraw': 'Withdraw',
    'wallet.import': 'Import wallet',
    'wallet.generate': 'Generate New Wallet',
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
    'empty.noHoldings': 'Oops, No Holdings Found!',
    'earn.subtitle': 'Get a bonus as you share to people.',
    'holdings.subtitle': 'View all tokens you\'ve bought',
    'walletManager.subtitle': 'Manage all your wallets here.',
    'sniper.subtitle': 'Automated trading and sniping tools',
  },
  zh: {
    'brand.name': 'Omax',
    'nav.trending': '趋势',
    'nav.walletTracker': '钱包追踪',
    'nav.monitor': '监控',
    'nav.trenches': '战壕',
    'nav.holdings': '持仓',
    'nav.earn': '赚取',
    'nav.points': '积分',
    'nav.sniper': '狙击手',
    'pages.trending.title': '趋势',
    'pages.trending.subtitle': '按交易量排序的热门代币对。',
    'pages.trenches.title': 'Omax平台',
    'pages.trenches.subtitle': '代币生命周期的实时动态。',
    'pages.token.title': '代币详情',
    'pages.wallet.title': '钱包追踪器',
    'pages.earn.title': '赚取',
    'pages.holdings.title': '我的持仓',
    'pages.walletManager.title': '钱包管理',
    'pages.sniper.title': '狙击手',
    'wallet.connect': '连接钱包',
    'wallet.connected': '钱包已连接',
    'wallet.deposit': '存款',
    'wallet.withdraw': '提款',
    'wallet.import': '导入钱包',
    'wallet.generate': '生成新钱包',
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
    'empty.noHoldings': '哎呀！没有找到持仓！',
    'earn.subtitle': '通过分享给他人获得奖励。',
    'holdings.subtitle': '查看您购买的所有代币',
    'walletManager.subtitle': '在这里管理您的所有钱包。',
    'sniper.subtitle': '自动交易和狙击工具',
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
