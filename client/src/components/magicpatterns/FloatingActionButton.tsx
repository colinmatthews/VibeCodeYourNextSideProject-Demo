import React from 'react';
import { UploadIcon } from 'lucide-react';
interface FloatingActionButtonProps {
  onClick: () => void;
}
export const FloatingActionButton = ({
  onClick
}: FloatingActionButtonProps) => {
  return <button onClick={onClick} className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 lg:hidden" aria-label="Upload">
      <UploadIcon className="h-6 w-6" />
    </button>;
};