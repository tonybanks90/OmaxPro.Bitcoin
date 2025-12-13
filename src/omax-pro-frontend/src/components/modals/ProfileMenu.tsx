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
  User
} from 'lucide-react';
import { Link } from 'wouter';

interface ProfileMenuProps {
  children?: React.ReactNode;
}

export function ProfileMenu({ children }: ProfileMenuProps) {
  const handle2FA = () => {
    console.log('Opening soon...');
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition"
            data-testid="profile-trigger"
          >
            <User className="h-5 w-5 text-foreground" />
          </button>
        )}
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



        <DropdownMenuItem asChild>
          <a
            href="https://omaxpro.gitbook.io/omaxpro-docs"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="menu-documentation"
            className="flex items-center cursor-pointer w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </a>
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
