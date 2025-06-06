import * as React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { CardHeader } from "@/components/ui/card"; // Added import for CardHeader

export default function Navbar() {
  const [user, setUser] = useState(auth.currentUser);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    auth.signOut();
    setLocation("/");
  };

  return (
    <nav className="border-b border-gray-700 bg-gray-800">
      <div className="w-full h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 pl-4">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-xl font-bold text-white">Component Generator</span>
          </a>
        </Link>
        <div className="flex items-center gap-4 pr-4">
          <Link href="/pricing">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700">Pricing</Button>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700">Dashboard</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700">Settings</Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" className="border-gray-600 text-white hover:bg-gray-700 hover:text-white">Sign Out</Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}