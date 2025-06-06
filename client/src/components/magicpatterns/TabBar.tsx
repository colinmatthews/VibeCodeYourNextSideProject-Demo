import React from 'react';
import { UploadIcon, LibraryIcon } from 'lucide-react';
interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export const TabBar = ({
  activeTab,
  onTabChange
}: TabBarProps) => {
  return <div className="bg-white border-b border-gray-200">
      <div className="flex">
        <button onClick={() => onTabChange('upload')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
          <UploadIcon className="h-4 w-4" />
          Upload
        </button>
        <button onClick={() => onTabChange('library')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'library' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
          <LibraryIcon className="h-4 w-4" />
          Library
        </button>
      </div>
    </div>;
};