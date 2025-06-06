import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4 text-white">Vibe Code Your Next Side Project</h3>
            <p className="text-gray-400">Making modern web development simple and effective.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-gray-400 hover:text-indigo-400">Dashboard</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-indigo-400">Login</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-indigo-400">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-indigo-400">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">support@webapptemplate.com</li>
              <li className="text-gray-400">Documentation</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Vibe Code Your Next Side Project. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}