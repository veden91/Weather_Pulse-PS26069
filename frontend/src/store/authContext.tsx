import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRoleType } from '../types';
import { login as apiLogin } from '../services/api';

export interface RoleConfig {
  role: UserRoleType;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
  allowedRoutes: string[];
  defaultRoute: string;
  demoUsername: string;
  demoPassword: string;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Administrator Command',
    badge: 'ADMIN • FULL ACCESS',
    badgeColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    description: 'Unrestricted national command & governance, user federation, data sources, simulation control, and system compliance.',
    allowedRoutes: ['/dashboard', '/events', '/reports', '/map', '/analytics', '/verification', '/alerts', '/sources', '/admin', '/system', '/report'],
    defaultRoute: '/dashboard',
    demoUsername: 'admin',
    demoPassword: 'admin123',
  },
  ANALYST: {
    role: 'ANALYST',
    title: 'Meteorological Analyst',
    badge: 'ANALYST • INTELLIGENCE',
    badgeColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
    description: 'Advanced meteorological intelligence, spatio-temporal GIS, 10-chart analytical dashboards, event trends, and warning advisories.',
    allowedRoutes: ['/dashboard', '/events', '/reports', '/map', '/analytics', '/alerts'],
    defaultRoute: '/dashboard',
    demoUsername: 'analyst',
    demoPassword: 'analyst123',
  },
  VERIFIER: {
    role: 'VERIFIER',
    title: 'Duty Verification Officer',
    badge: 'VERIFIER • DUTY OFFICER',
    badgeColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    description: 'Human-in-the-loop triage queue, multi-source corroboration, AI-flagged report validation, and false-alarm mitigation.',
    allowedRoutes: ['/verification', '/events', '/reports', '/alerts', '/dashboard'],
    defaultRoute: '/verification',
    demoUsername: 'verifier',
    demoPassword: 'verifier123',
  },
  CITIZEN: {
    role: 'CITIZEN',
    title: 'Citizen Portal',
    badge: 'CITIZEN • PUBLIC OBSERVER',
    badgeColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    description: 'Crowdsourced weather incident intake with GPS detection, photo/video simulator, docket tracking, and public hazard alerts.',
    allowedRoutes: ['/report', '/map', '/alerts', '/events'],
    defaultRoute: '/report',
    demoUsername: 'citizen',
    demoPassword: 'citizen123',
  },
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRoleType | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  quickLogin: (role: 'ADMIN' | 'ANALYST' | 'VERIFIER' | 'CITIZEN') => Promise<User>;
  logout: () => void;
  hasRole: (allowedRoles: UserRoleType[]) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session from storage on boot
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('weatherpulse_token');
      const storedUser = localStorage.getItem('weatherpulse_user');
      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        // Normalize VIEWER to CITIZEN
        if ((parsedUser.role as string) === 'VIEWER') {
          parsedUser.role = 'CITIZEN';
        }
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      localStorage.removeItem('weatherpulse_token');
      localStorage.removeItem('weatherpulse_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiLogin(username, password);
      const authenticatedUser: User = response.user;
      if ((authenticatedUser.role as string) === 'VIEWER') {
        authenticatedUser.role = 'CITIZEN';
      }
      setUser(authenticatedUser);
      setToken(response.access_token);
      localStorage.setItem('weatherpulse_token', response.access_token);
      localStorage.setItem('weatherpulse_user', JSON.stringify(authenticatedUser));
      return authenticatedUser;
    } catch (err) {
      // Fallback for offline/demo if API is unreachable
      console.warn('API login failed, checking fallback credentials:', err);
      const matchedConfig = Object.values(ROLE_CONFIGS).find(
        (cfg) => cfg.demoUsername.toLowerCase() === username.toLowerCase()
      );
      if (matchedConfig && (password === matchedConfig.demoPassword || password === 'demo123')) {
        const mockUser: User = {
          id: `usr-${matchedConfig.role.toLowerCase()}`,
          username: matchedConfig.demoUsername,
          email: `${matchedConfig.demoUsername}@weatherpulse.gov.in`,
          full_name: matchedConfig.title,
          role: matchedConfig.role,
          department: matchedConfig.role === 'ADMIN' ? 'Ministry of Earth Sciences' : 'National Weather Operations',
        };
        const mockToken = `mock-token-${matchedConfig.role.toLowerCase()}-${Date.now()}`;
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('weatherpulse_token', mockToken);
        localStorage.setItem('weatherpulse_user', JSON.stringify(mockUser));
        return mockUser;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetRole: 'ADMIN' | 'ANALYST' | 'VERIFIER' | 'CITIZEN'): Promise<User> => {
    const config = ROLE_CONFIGS[targetRole];
    if (!config) throw new Error(`Unknown role: ${targetRole}`);
    return login(config.demoUsername, config.demoPassword);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('weatherpulse_token');
    localStorage.removeItem('weatherpulse_user');
  };

  const hasRole = (allowedRoles: UserRoleType[]): boolean => {
    if (!user) return false;
    const currentRole = user.role === 'VIEWER' ? 'CITIZEN' : user.role;
    // ADMIN has full access to the whole portal
    if (currentRole === 'ADMIN') return true;
    return allowedRoles.includes(currentRole as UserRoleType);
  };

  const canAccessRoute = (pathname: string): boolean => {
    if (!user) return false;
    const currentRole = user.role === 'VIEWER' ? 'CITIZEN' : user.role;
    // ADMIN has access to all routes
    if (currentRole === 'ADMIN') return true;

    const config = ROLE_CONFIGS[currentRole];
    if (!config) return false;

    // Check direct match or parent path
    return config.allowedRoutes.some((route) => {
      if (route === pathname) return true;
      if (pathname.startsWith(route) && route !== '/') return true;
      return false;
    });
  };

  const getDefaultRoute = (): string => {
    if (!user) return '/';
    const currentRole = user.role === 'VIEWER' ? 'CITIZEN' : user.role;
    const config = ROLE_CONFIGS[currentRole];
    return config ? config.defaultRoute : '/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user ? ((user.role === 'VIEWER' ? 'CITIZEN' : user.role) as UserRoleType) : null,
        isLoading,
        login,
        quickLogin,
        logout,
        hasRole,
        canAccessRoute,
        getDefaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
