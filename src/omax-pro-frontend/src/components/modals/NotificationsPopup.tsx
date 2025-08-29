import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { FileText, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  time: string;
  type: string;
  token: string;
  amount: string;
  marketCap: string;
  walletName: string;
  mode: string;
  action: string;
}

interface NotificationsPopupProps {
  children: React.ReactNode;
}

export function NotificationsPopup({ children }: NotificationsPopupProps) {
  // Mock notifications data - in real app this would come from props or API
  const notifications: Notification[] = [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl p-0 bg-background border-border"
        align="end"
        data-testid="notifications-popup"
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Alerts</h3>
        </div>

        {/* Empty State */}
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <FileText className="w-16 h-16 text-muted-foreground/30" />
                <AlertCircle className="w-6 h-6 text-muted-foreground absolute -top-1 -right-1" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">
              No Alerts Available
            </h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You currently have no alerts. Start by making a few trades to receive alerts.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-8 min-w-[600px] gap-4 p-4 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/20">
                <div>Time</div>
                <div>Type</div>
                <div>Token</div>
                <div>Amount</div>
                <div>Market Cap</div>
                <div>Wallet Name</div>
                <div>Mode</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="grid grid-cols-8 min-w-[600px] gap-4 p-4 text-sm hover:bg-muted/50 transition-colors"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="text-muted-foreground">{notification.time}</div>
                    <div className="text-foreground">{notification.type}</div>
                    <div className="text-foreground">{notification.token}</div>
                    <div className="text-foreground">{notification.amount}</div>
                    <div className="text-foreground">{notification.marketCap}</div>
                    <div className="text-foreground">{notification.walletName}</div>
                    <div className="text-foreground">{notification.mode}</div>
                    <div>
                      <Button size="sm" variant="outline" data-testid={`action-${notification.id}`}>
                        {notification.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" data-testid="button-mark-all-read">
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" data-testid="button-view-all-alerts">
              View all alerts
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
