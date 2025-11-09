import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title: string;
  link: string;
  banner: string;
  status: 'on' | 'off';
}

import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface AdCardProps {
  ad: Ad;
  onStatusChange?: (id: string, status: 'on' | 'off') => void;
  onEdit?: (ad: Ad) => void;
  onDelete?: (ad: Ad) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onStatusChange, onEdit, onDelete }) => {
  if (!ad) {
    return null;
  }

  const [status, setStatus] = useState(ad.status ?? 'off');

  const handleStatusChange = async (newStatus: boolean) => {
    if (!onStatusChange) return;
    const newStatusString = newStatus ? 'on' : 'off';
    setStatus(newStatusString);
    try {
      onStatusChange(ad.id, newStatusString);
      toast.success(`Ad status updated to ${newStatusString}`);
    } catch (error) {
      toast.error('Failed to update ad status');
      setStatus(ad.status ?? 'off'); // Revert on failure
    }
  };

  return (
    <div className="text-center p-4 border rounded-lg shadow-md">
      <a href={ad.link ?? '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg shadow-md mb-2">
        <img 
          src={ad.banner ?? ''} 
          alt={ad.title ?? 'Ad banner'} 
          className="w-full h-full object-cover" 
        />
      </a>
      <a href={ad.link ?? '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
        {ad.title}
      </a>
      <div className="flex items-center justify-center space-x-2 mt-4">
        {onStatusChange && (
          <>
            <Switch
              id={`status-${ad.id}`}
              checked={status === 'on'}
              onCheckedChange={handleStatusChange}
            />
            <Label htmlFor={`status-${ad.id}`}>{status === 'on' ? 'ON' : 'OFF'}</Label>
          </>
        )}
        {onEdit && (
          <Button variant="outline" size="icon" onClick={() => onEdit(ad)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="icon" onClick={() => onDelete(ad)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdCard;
