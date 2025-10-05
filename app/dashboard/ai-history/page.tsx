'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AIGeneration {
  id: string;
  type: 'image' | 'video';
  model: string;
  prompt: string;
  output_url: string;
  output_data: any;
  cost: number;
  generation_time_ms: number;
  created_at: string;
}

export default function AIHistoryPage() {
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
      .from('ai_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading history:', error);
    } else {
      setGenerations(data || []);
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">AI Generation History</h1>
            <p className="text-slate-400">View all your generated images and videos</p>
          </div>
          <Link href="/dashboard/ai-studio">
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
              Generate New
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'image', 'video'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Generation Grid */}
      <div className="max-w-7xl mx-auto">
        {generations.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <div className="text-slate-400 mb-4">No generations found</div>
            <Link href="/dashboard/ai-studio">
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
                Create Your First Generation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-fuchsia-500/50 transition-all"
              >
                {/* Media Preview */}
                <div className="aspect-video bg-black/20 relative group">
                  {gen.type === 'image' ? (
                    <img
                      src={gen.output_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        src={gen.output_url}
                        poster={gen.output_data?.thumbnailUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gen.type === 'image'
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-purple-500/80 text-white'
                    }`}>
                      {gen.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="text-sm text-slate-400 mb-2 line-clamp-2">
                    {gen.prompt}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>{gen.model}</span>
                    <span>{formatDate(gen.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400">{formatCost(gen.cost)}</span>
                    <span className="text-slate-400">{formatTime(gen.generation_time_ms)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <a
                      href={gen.output_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors text-center"
                    >
                      View Full
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gen.prompt);
                        // Could add a toast notification here
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                      title="Copy prompt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
