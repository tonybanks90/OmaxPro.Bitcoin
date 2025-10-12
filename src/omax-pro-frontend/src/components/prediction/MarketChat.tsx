import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { MessageCircle, Send, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'bet' | 'system';
  betInfo?: {
    option: string;
    amount: string;
    type: 'buy' | 'sell';
  };
}

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    user: 'tennis_expert',
    message: 'Djokovic has been training hard for this. His recent form looks incredible!',
    timestamp: new Date(Date.now() - 300000),
    type: 'message'
  },
  {
    id: '2',
    user: 'sports_bettor',
    message: '',
    timestamp: new Date(Date.now() - 240000),
    type: 'bet',
    betInfo: {
      option: 'Novak Djokovic',
      amount: '$150',
      type: 'buy'
    }
  },
  {
    id: '3',
    user: 'alcaraz_fan',
    message: 'Alcaraz is younger and has more energy. Plus he beat Djokovic last time they met.',
    timestamp: new Date(Date.now() - 180000),
    type: 'message'
  },
  {
    id: '4',
    user: 'crypto_trader',
    message: '',
    timestamp: new Date(Date.now() - 120000),
    type: 'bet',
    betInfo: {
      option: 'Carlos Alcaraz',
      amount: '$75',
      type: 'buy'
    }
  },
  {
    id: '5',
    user: 'system',
    message: 'New high volume bet placed on Djokovic!',
    timestamp: new Date(Date.now() - 60000),
    type: 'system'
  }
];

interface MarketChatProps {
  marketId: string;
}

export function MarketChat({ marketId }: MarketChatProps) {
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');
  const [messages] = useState<ChatMessage[]>(sampleMessages);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message to the backend
    setNewMessage('');
  };

  const getUserInitials = (username: string) => {
    return username.split('_').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="h-full border-2 border-border/50 shadow-lg bg-gradient-to-br from-surface to-surface/80">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-t-xl border-b border-border/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent text-xl">
              Live Discussion
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-accent/30">
              {messages.length} messages
            </Badge>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Chat Messages */}
        <div 
          className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent" 
          data-testid="chat-messages"
        >
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'system' ? (
                <div className="bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl p-3 text-center border border-border/20">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-muted-foreground">{message.message}</span>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : message.type === 'bet' ? (
                <div className="bg-gradient-to-r from-accent/5 to-accent/10 border-2 border-accent/20 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8 border-2 border-accent/30">
                        <AvatarFallback className="text-xs font-semibold bg-accent/10 text-accent">
                          {getUserInitials(message.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-sm text-foreground">{message.user}</span>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      message.betInfo?.type === 'buy' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {message.betInfo?.type === 'buy' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="bg-background/30 rounded-lg p-3 border border-border/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {message.betInfo?.type === 'buy' ? '🟢 Bought' : '🔴 Sold'} 
                      </span>
                      <span className="font-bold text-foreground">{message.betInfo?.amount}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-sm font-medium text-accent">{message.betInfo?.option}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-background/30 border border-border/20 hover:bg-background/50 transition-colors">
                  <Avatar className="w-8 h-8 border-2 border-border/30 mt-1">
                    <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                      {getUserInitials(message.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-sm text-foreground">{message.user}</span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed break-words">{message.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="border-t border-border/30 pt-4 bg-gradient-to-r from-muted/20 to-muted/10 -mx-4 px-4 rounded-b-xl">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8 border-2 border-accent/30">
              <AvatarFallback className="text-xs font-semibold bg-accent/10 text-accent">
                YU
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Input
                placeholder="Share your thoughts on this market..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-12 border-2 border-border/30 focus:border-accent/50 bg-background/80 backdrop-blur-sm"
                data-testid="input-new-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0 bg-accent hover:bg-accent/90"
                data-testid="button-send-message"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              <span>💡</span>
              <span>Be respectful and follow community guidelines</span>
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
              <span>Live chat</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}