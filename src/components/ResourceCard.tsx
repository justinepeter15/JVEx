import { Resource } from '../types';
import { FileText, Book, Download, Lock, Trophy, Star, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import ReviewSystem from './ReviewSystem';

interface ResourceCardProps {
  resource: Resource;
  isUnlocked: boolean;
  onView: (resource: Resource) => void;
  onSubscribe: () => void;
  key?: string;
}

export default function ResourceCard({ resource, isUnlocked, onView, onSubscribe }: ResourceCardProps) {
  // Custom icons based on type
  const getTypeIcon = () => {
    switch (resource.type) {
      case 'exam': return <Trophy className="w-5 h-5" />;
      case 'book': return <Book className="w-5 h-5" />;
      case 'lesson_plan': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-slate-200 flex flex-col group hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="aspect-[16/10] relative bg-slate-100 overflow-hidden">
        {resource.thumbnailUrl ? (
          <img 
            src={resource.thumbnailUrl} 
            alt={resource.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
             {getTypeIcon()}
          </div>
        )}
        
        {resource.isPremium && !isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/90 p-3 rounded-xl shadow-lg">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
           <span className={cn(
             "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm",
             resource.isPremium ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
           )}>
             {resource.isPremium ? 'Premium' : 'Free'}
           </span>
           {resource.downloadCount > 1000 && (
             <span className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
               <Sparkles className="w-2.5 h-2.5" />
               Trending
             </span>
           )}
           {resource.isPremium && resource.price && resource.price > 0 && !isUnlocked && (
             <span className="px-2 py-1 bg-white text-indigo-600 rounded text-[10px] font-black border border-indigo-100 shadow-sm">
               TSh {resource.price}
             </span>
           )}
        </div>

        {resource.averageRating && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-[10px] font-black text-slate-900">{resource.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-slate-400">
            {getTypeIcon()}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{resource.type.replace('_', ' ')}</span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{resource.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{resource.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <Download className="w-3 h-3" />
            <span>{resource.downloadCount}</span>
          </div>
          
          {resource.isPremium && !isUnlocked ? (
            <button 
              onClick={onSubscribe}
              className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              {resource.price && resource.price > 0 ? "Unlock Content" : "Premium Only"}
            </button>
          ) : (
            <button 
              onClick={() => onView(resource)}
              className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2"
            >
              Download Now
            </button>
          )}
        </div>

        <ReviewSystem resource={resource} isUnlocked={isUnlocked} />
      </div>
    </motion.div>
  );
}
