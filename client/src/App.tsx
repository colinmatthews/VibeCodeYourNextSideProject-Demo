import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Component, ErrorInfo, ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Profile from "@/pages/profile";
import Pricing from "@/pages/pricing";
import Footer from "@/components/Footer";
import Settings from "@/pages/settings";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Something went wrong</h1>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const [location] = useLocation();
  
  // Only show Footer on landing page
  const showFooter = location === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 dark">
      <Navbar />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;