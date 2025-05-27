import { Facebook, X, Share2 } from 'lucide-react';
import { Project } from '../../types/database.types';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function ShareModal({ isOpen, onClose, project }: ShareModalProps) {
  if (!isOpen) return null;

  const projectUrl = `${window.location.origin}/project/${project.slug}`;
  
  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '📱',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this project: ${project.title} - ${projectUrl}`)}`,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: `https://t.me/share/url?url=${encodeURIComponent(projectUrl)}&text=${encodeURIComponent(`Check out this project: ${project.title}`)}`,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`,
      color: 'bg-[#1877F2] hover:bg-[#0e67da]'
    },
  ];

  const copyToClipboard = () => {
    const tempInput = document.createElement('textarea');
    tempInput.value = projectUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy link.');
    }
    document.body.removeChild(tempInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"> {/* MODIFIED: Tambahkan z-50 pada div utama modal */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="bg-white/10 dark:bg-neutral-800/20 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden backdrop-blur-md border border-white/20 dark:border-neutral-700/50">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-medium flex items-center">
            <Share2 className="mr-2 h-5 w-5" /> Share Project
          </h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <h4 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{project.title}</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Share this project with others</p>
          
          <div className="border border-gray-200 dark:border-neutral-700 rounded-md p-3 mb-4 bg-gray-50 dark:bg-neutral-700 flex items-center">
            <input 
              type="text"
              readOnly
              value={projectUrl}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 dark:text-gray-300"
              id="project-share-url" // Baris ini ditambahkan untuk mengatasi peringatan
            />
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              size="sm"
              className="ml-2 whitespace-nowrap"
            >
              Copy
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-2">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${option.color} text-white rounded-md py-3 px-4 text-center flex flex-col items-center justify-center hover:opacity-90 transition-colors`}
              >
                <span className="text-xl mb-1">{option.icon}</span>
                <span className="text-sm">{option.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}