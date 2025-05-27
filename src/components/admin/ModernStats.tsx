// src/components/admin/ModernStats.tsx
import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2'; // Removed Bar import
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  // Removed BarElement, CategoryScale, LinearScale
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend); // Removed Bar chart related registrations

interface StatsProps {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
}

export default function ModernStats({ stats }: { stats: StatsProps }) {
  const { total, active, upcoming, completed } = stats;

  const pieChartData = useMemo(() => ({
    labels: ['Active', 'Upcoming', 'Completed'],
    datasets: [
      {
        data: [active, upcoming, completed],
        backgroundColor: ['#22c55e', '#facc15', '#94a3b8'], // Green, Amber, Slate (modern neutral)
        borderColor: ['#16a34a', '#eab308', '#64748b'],
        borderWidth: 1,
      },
    ],
  }), [active, upcoming, completed]);

  // Removed barChartData

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false, // Allows flexible height based on container
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af', // Neutral gray for legend labels
          font: {
            size: 13,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker tooltip background for better contrast
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 6,
        displayColors: true,
      },
    },
    // Removed scales for x and y axes as they are not needed for Doughnut chart
  }), []);

  return (
    <div className="grid grid-cols-1"> {/* Simplified grid to single column */}
      {/* Pie / Doughnut Chart - Now takes full width */}
      <div className="bg-white dark:bg-neutral-800 p-7 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-50 mb-5">Project Distribution</h2>
        <div className="h-64 flex justify-center items-center">
          <Doughnut data={pieChartData} options={chartOptions} />
        </div>
        <p className="text-base mt-6 text-center text-neutral-500 dark:text-neutral-300">
          <span className="font-semibold text-neutral-700 dark:text-neutral-100">Total Projects:</span>{' '}
          <strong className="text-2xl text-blue-600 dark:text-blue-400">{total}</strong>
        </p>
      </div>

      {/* Bar Chart section removed */}
    </div>
  );
}