import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Game from './game/Game';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen overflow-hidden">
        <Game />
      </div>
    </QueryClientProvider>
  );
}

export default App;