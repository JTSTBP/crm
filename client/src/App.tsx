import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/Auth/LoginForm";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import ExecutiveDashboard from "./components/Dashboard/ExecutiveDashboard";
import ManagerDashboard from "./components/Dashboard/ManagerDashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import LeadsList from "./components/Leads/LeadsList";
import TasksList from "./components/Tasks/TasksList";
import UserManagement from "./components/Settings/UserManagement";
import ReportsDashboard from "./components/Reports/ReportsDashboard";
import ProposalsTab from "./components/Proposals/ProposalsTab";
import RateCardsList from "./components/RateCards/RateCardsList";
import EmailTab from "./components/Email/EmailTab";
import InternalCommunicationTab from "./components/InternalCommunication/InternalCommunicationTab";
import TimeManagementTab from "./components/TimeManagement/TimeManagementTab";
import AutomationTab from "./components/Automation/AutomationTab";
import { LeadsProvider } from "./contexts/leadcontext";
import { EmailProvider } from "./contexts/EmailContext";

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setCurrentPage("dashboard");
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6 shadow-lg"></div>
          <p className="text-white text-lg font-medium">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "BD Executive":
        return <ExecutiveDashboard />;
      case "Manager":
        return <ManagerDashboard />;
      case "Admin":
        return <AdminDashboard />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return renderDashboard();
      case "leads":
        return <LeadsList />;
      case "email":
        return <EmailTab />;
      case "internal-communication":
        return <InternalCommunicationTab />;
      case "time-management":
        return <TimeManagementTab />;
      case "automation":
        return <AutomationTab />;
      case "proposals":
        return <ProposalsTab />;
      case "rate-cards":
        return <RateCardsList />;
      case "tasks":
        return <TasksList />;
      case "reports":
        return <ReportsDashboard />;
      case "settings":
        return <UserManagement />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-3/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex">
        {/* Mobile Sidebar */}
        {isMobile && isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden backdrop-blur-sm">
            <div
              className="fixed inset-0 bg-black bg-opacity-60"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 z-50">
              <Sidebar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isMobile={true}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className={`${isMobile ? "hidden" : "w-64 flex-shrink-0"}`}>
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>

        {/* Main Content */}
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-auto">
          <Header
            onMenuClick={() => setIsMobileMenuOpen(true)}
            isMobile={isMobile}
          />
          <main className="flex-1 p-4 lg:p-8">
            {!user || !profile ? <LoginForm /> : renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LeadsProvider>
        <EmailProvider>
          <AppContent />
          <Toaster position="top-right" />
        </EmailProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}

export default App;
