import { useState } from 'react';

// The images are being referenced as external URLs to prevent build errors.
// In a real project, you would place them in the public folder.
const reactLogo = 'https://placehold.co/96x96/61DAFB/000000?text=React';
const viteLogo = 'https://placehold.co/96x96/747bff/ffffff?text=Vite';

/**
 * Main application component.
 * Uses Tailwind CSS v4 utility classes for styling.
 */
function App() {
  // State hook to manage the button click count.
  const [count, setCount] = useState(0);

  return (
    // Main container with a dark background, centered content, and padding.
    // The "min-h-screen" ensures it takes up the full viewport height.
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-8 text-gray-100">

      {/* Container for the Vite and React logos with spacing. */}
      <div className="flex items-center space-x-8">
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          {/* Vite logo with a responsive size and a hover effect. */}
          <img
            src={viteLogo}
            className="size-24 transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          {/* React logo with a responsive size, hover effect, and spin animation. */}
          <img
            src={reactLogo}
            className="size-24 animate-[spin_20s_linear_infinite] transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa]"
            alt="React logo"
          />
        </a>
      </div>

      {/* Main heading for the application. */}
      <h1 className="my-8 text-5xl font-extrabold text-white sm:text-6xl">Vite + React</h1>

      {/* Card container for the button and text. */}
      <div className="w-full max-w-lg rounded-xl bg-gray-900 p-8 shadow-2xl">
        {/* Button to increment the count, with Tailwind styling. */}
        <button
          className="mb-4 w-full rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-500"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        {/* Paragraph for instructions with a slightly muted color. */}
        <p className="text-sm text-gray-400">
          Edit{' '}
          <code className="rounded bg-gray-800 px-1 py-0.5 font-mono text-gray-300">
            src/App.tsx
          </code>{' '}
          and save to test HMR
        </p>
      </div>

      {/* Small footer text with a softer color. */}
      <p className="mt-6 text-sm text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
