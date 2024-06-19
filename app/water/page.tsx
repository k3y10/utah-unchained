'use client';

import { useState } from 'react';
import { generateOpenAIPrompt, processStatusCheck, StatusCheckResult } from '@/utilities/utahGenAI';

export default function WaterPage() {
  const [location, setLocation] = useState('');
  const [data, setData] = useState<StatusCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchData = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await fetch('/api/filter-water-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://deq.utah.gov/arcgis/rest/services/DEQ_WQ/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json', // Update with the correct URL if needed
          location: location,
          response_format: 'json',
        }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      
      const items = result.map((item: any) => item.SubArea);
      const descriptions = result.map((item: any) => item.description);

      const prompt = await generateOpenAIPrompt({ items, results: descriptions });
      console.log(prompt);

      const statusCheckResults: StatusCheckResult[] = result.map((item: any) => ({
        item: item.SubArea,
        description: item.description,
        classification: 'ON TRACK', // default classification
      }));

      const updatedResults = await processStatusCheck(statusCheckResults, {
        'NOT MET': 'not on track',
        'MET': 'met',
      });

      setData(updatedResults);
    } catch (error) {
      setError('Error fetching data. Please try again.');
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-4xl font-bold mt-4">AI-Governance for Water Data Records</h1>
      <p className="text-xl mt-4 text-center">
        Explore how our AI-Governance system enhances the management and sustainability of water resources through advanced data analysis.
      </p>

      <section className="mt-8 w-full max-w-4xl">
        <h2 className="text-3xl font-semibold">Fetch Water Data</h2>
        <p className="mt-2">
          Enter a location to retrieve water data records for that area.
        </p>
        <div className="mt-4">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 text-black"
          />
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="ml-4 px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
          >
            {loading ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {data && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold">Data Results</h3>
            <table className="mt-4 p-4 bg-gray-100 rounded-md w-full">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Item</th>
                  <th className="border px-4 py-2">Description</th>
                  <th className="border px-4 py-2">Classification</th>
                </tr>
              </thead>
              <tbody>
                {data.map((result, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{result.item}</td>
                    <td className="border px-4 py-2">{result.description}</td>
                    <td className="border px-4 py-2">{result.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
