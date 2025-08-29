import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Wallet, 
  FileText, 
  Shield, 
  LogOut,
  Settings
} from 'lucide-react';

interface ProfileMenuProps {
  children: React.ReactNode;
}

export function ProfileMenu({ children }: ProfileMenuProps) {
  const handleWalletManager = () => {
    // Handle wallet manager action
    console.log('Opening wallet manager...');
  };

  const handleDocumentation = () => {
    // Handle documentation action
    window.open('/docs', '_blank');
  };

  const handle2FA = () => {
    // Handle 2FA settings
    console.log('Opening 2FA settings...');
  };

  const handleLogout = () => {
    // Handle logout action
    window.location.href = '/api/logout';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-background border-border" 
        align="end"
        data-testid="profile-menu"
      >
        <DropdownMenuLabel className="text-foreground">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleWalletManager}
          className="cursor-pointer"
          data-testid="menu-wallet-manager"
        >
          <Wallet className="mr-2 h-4 w-4" />
          <span>Wallet Manager</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDocumentation}
          className="cursor-pointer"
          data-testid="menu-documentation"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Documentation</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handle2FA}
          className="cursor-pointer"
          data-testid="menu-2fa"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Two-Factor Authentication</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
          data-testid="menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}