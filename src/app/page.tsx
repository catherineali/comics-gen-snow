'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ComicPanel {
  prompt: string;
  caption: string;
  imageUrl?: string;
}

interface HistoryItem {
  prompt: string;
  image_url: string;
  created_at: string;
}

export default function Home() {
  const [userPrompt, setUserPrompt] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch history when component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('https://sundai-backend-176750765325.us-east4.run.app/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const generateComic = async () => {
    try {
      setLoading(true);
      setError(null);
      setPanels([]);

      // First, generate the story
      const storyResponse = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const storyData = await storyResponse.json();
      console.log('Story data:', storyData);

      if (!storyResponse.ok) throw new Error(storyData.error || 'Failed to generate story');
      if (!storyData.result?.comics) throw new Error('Invalid story format received');

      // Initialize panels with prompts and captions
      const initialPanels = storyData.result.comics;
      setPanels(initialPanels);

      // Generate images for each panel
      for (let i = 0; i < initialPanels.length; i++) {
        try {
          const imageResponse = await fetch('/api/generate-img', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: initialPanels[i].prompt }),
          });

          const imageData = await imageResponse.json();
          console.log('Image data for panel', i, ':', imageData);

          if (!imageResponse.ok) {
            console.error('Image generation failed for panel', i);
            continue;
          }

          setPanels(currentPanels => {
            const updatedPanels = [...currentPanels];
            updatedPanels[i] = {
              ...updatedPanels[i],
              imageUrl: imageData.imageUrl,
            };
            return updatedPanels;
          });
        } catch (imageError) {
          console.error('Error generating image for panel', i, ':', imageError);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate comic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-100">
      <main className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-12 text-blue-900">AI Comic Creator</h1>

        {/* Toggle Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showHistory ? 'Show Comic Creator' : 'Show History'}
        </button>

        {!showHistory ? (
          // Comic Creator Section
          <>
            <div className="flex flex-col items-center gap-4 mb-12">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe your comic story idea..."
                className="w-full p-4 border-2 border-sky-300 rounded-lg text-lg min-h-[120px]
                         text-gray-800 bg-white placeholder-gray-500 focus:border-sky-500
                         focus:ring-2 focus:ring-sky-500 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={generateComic}
                disabled={loading || !userPrompt.trim()}
                className="px-8 py-3 bg-sky-600 text-white rounded-lg text-lg font-semibold
                         hover:bg-sky-700 disabled:bg-gray-300 transition-colors
                         shadow-md hover:shadow-lg"
              >
                {loading ? 'Generating Comic...' : 'Generate Comic'}
              </button>
            </div>

            {error && (
              <div className="text-red-600 mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-lg text-sky-800 mb-8 p-4 bg-white/50 rounded-lg">
                Creating your comic...
              </div>
            )}

            {panels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {panels.map((panel, index) => (
                  <div key={index} className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-lg">
                    {panel.imageUrl ? (
                      <div className="relative aspect-square w-full">
                        <Image
                          src={panel.imageUrl}
                          alt={`Panel ${index + 1}`}
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-sky-50 rounded-lg flex items-center justify-center">
                        <div className="text-sky-600">Generating image...</div>
                      </div>
                    )}
                    <div className="text-sm text-gray-800 font-medium p-2 bg-sky-50 rounded-lg">
                      {panel.caption}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // History Section
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-lg">
                <div className="relative aspect-square w-full mb-4">
                  <Image
                    src={item.image_url}
                    alt={item.prompt}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">{item.prompt}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
