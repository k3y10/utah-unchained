'use client';

import { useState } from 'react';
import { generateOpenAIPrompt, processStatusCheck, StatusCheckResult } from '@/utilities/utahGenAI';

export default function TaxPage() {
  const [data, setData] = useState<StatusCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchData = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await fetch('/api/fetch-tax-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://tax.utah.gov/salestax/distribute/salestax_distribution_cy.xlsx',
        }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();

      const items = result.map((item: any) => item['Tax Type']);
      const descriptions = result.map((item: any) => item.Classification);

      const prompt = await generateOpenAIPrompt({ items, results: descriptions });
      console.log(prompt);

      const statusCheckResults: StatusCheckResult[] = result.map((item: any) => ({
        item: item['Tax Type'],
        fiscalYear: item['Fiscal Year'],
        amount: item.Amount,
        classification: item.Classification,
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
      <h1 className="text-4xl font-bold mt-4">AI-Governance for Public Tax Records</h1>
      <p className="text-xl mt-4 text-center">
        Discover how our AI-Governance system revolutionizes the management of public tax records, ensuring transparency and accountability for all citizens.
      </p>

      <section className="mt-8 w-full max-w-4xl">
        <h2 className="text-3xl font-semibold">Fetch Tax Data</h2>
        <p className="mt-2">
          Click the button below to retrieve the latest tax data records for analysis.
        </p>
        <div className="mt-4">
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
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
                  <th className="border px-4 py-2">Tax Type</th>
                  <th className="border px-4 py-2">Fiscal Year</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Classification</th>
                </tr>
              </thead>
              <tbody>
                {data.map((result, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{result.item}</td>
                    <td className="border px-4 py-2">{result.fiscalYear}</td>
                    <td className="border px-4 py-2">{result.amount}</td>
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
