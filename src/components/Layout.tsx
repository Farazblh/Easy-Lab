import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  TestTube,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Drumstick,
  ClipboardList,
  FilePlus
} from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

const Layout = ({ children, currentPage, onNavigate }: LayoutProps) => {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-report', label: 'Create Report', icon: FilePlus },
    { id: 'samples', label: 'Samples', icon: TestTube },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <img src="/Capture-removebg-preview.png" alt="MeatLab Pro" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-red-600">MeatLab Pro</h1>
              <p className="text-xs text-gray-500">Micro Lab Management</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-orange-600">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-2xl font-bold text-orange-600 capitalize">{currentPage}</h2>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
