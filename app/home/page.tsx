'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Any initial setup can be done here
  }, []);

  return (
    <main className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-4xl font-bold mt-4">Welcome to Utah Unchained</h1>
      <p className="text-xl mt-4 text-center">
        We are excited to announce the addition of an AI Layer to our platform, aimed at establishing AI-Governance for Public Tax Records and Water Data Records.
      </p>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-center">AI-Governance for Public Tax Records</h2>
        <p className="mt-2 text-center">
          Our AI-Governance system will streamline the management and accessibility of public tax records, ensuring transparency and accountability. The AI Layer will continuously monitor and update tax records, making it easier for citizens to stay informed about their tax obligations and government expenditures.
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-center">AI-Governance for Water Data Records</h2>
        <p className="mt-2 text-center">
          With our AI-Governance for Water Data Records, we aim to enhance the management of water resources. The AI Layer will track and analyze water usage data, helping to ensure sustainable water management practices. It will also provide timely updates on water-related issues and initiatives.
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-center">Keeping Up with Current Bills and Initiatives</h2>
        <p className="mt-2 text-center">
          Our AI Layer will keep track of the latest bills and government-related public initiatives. This will allow citizens to stay informed about legislative changes and participate actively in the governance process. The AI system will provide real-time updates and insights into ongoing government activities.
        </p>
      </div>
      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={() => setLoading(!loading)}
          disabled={loading}
          className="px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
        >
          {loading ? 'Loading...' : 'Learn More'}
        </button>
      </div>
    </main>
  );
}
