import { useState, useEffect } from 'react';
import Game from './game/Game';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading resources
    setTimeout(() => {
      setLoaded(true);
    }, 500);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-full flex items-center justify-center bg-background">
        {!loaded ? (
          <div className="text-foreground">Loading...</div>
        ) : (
          <Game />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
