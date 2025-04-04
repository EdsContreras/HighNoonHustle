import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [audioStatus, setAudioStatus] = useState<string>('Not tested');
  const baseUrl = window.location.origin;
  
  // Function to test audio
  // New function to test all audio files from both locations
  const testAllAudioFiles = () => {
    const files = ['background.mp3', 'hit.mp3', 'success.mp3', 'grunt.mp3', 'gameover.mp3'];
    const results: Record<string, string> = {};
    
    // Test files from both locations
    files.forEach(file => {
      // Test from /sounds/
      const audio1 = new Audio(`${baseUrl}/sounds/${file}`);
      audio1.addEventListener('canplaythrough', () => {
        results[`/sounds/${file}`] = 'Loaded';
        updateStatus();
      });
      audio1.addEventListener('error', () => {
        results[`/sounds/${file}`] = 'Failed';
        updateStatus();
      });
      
      // Test from /assets/sounds/
      const audio2 = new Audio(`${baseUrl}/assets/sounds/${file}`);
      audio2.addEventListener('canplaythrough', () => {
        results[`/assets/sounds/${file}`] = 'Loaded';
        updateStatus();
      });
      audio2.addEventListener('error', () => {
        results[`/assets/sounds/${file}`] = 'Failed';
        updateStatus();
      });
    });
    
    // Update the status display
    const updateStatus = () => {
      const statusText = Object.entries(results)
        .map(([file, status]) => `${file}: ${status}`)
        .join('\n');
      setAudioStatus(statusText);
    };
    
    // Initial status
    setAudioStatus('Testing all audio files from multiple locations...');
  };
  
  // Test a specific sound file with play attempt
  const testAudio = () => {
    setAudioStatus('Testing grunt.mp3 from /assets/sounds/...');
    
    try {
      // Create a simple test sound from the assets/sounds directory instead
      const audio = new Audio(`${baseUrl}/assets/sounds/grunt.mp3`);
      audio.volume = 0.5;
      
      // Log sound info
      console.log('Testing sound:', audio.src);
      
      // Add event listeners
      audio.addEventListener('canplaythrough', () => {
        setAudioStatus(`Audio loaded successfully from ${audio.src}`);
        
        // Try to play after a click event has occurred
        const playAttempt = () => {
          audio.play()
            .then(() => {
              setAudioStatus(`Audio played successfully from ${audio.src}`);
            })
            .catch(error => {
              setAudioStatus(`Play error: ${error.message}`);
            });
        };
        
        // Try to play immediately
        playAttempt();
      });
      
      audio.addEventListener('error', (e) => {
        setAudioStatus(`Load error: ${e}`);
        console.error('Audio load error:', e);
        
        // Try the other location
        setAudioStatus('Trying backup location /sounds/grunt.mp3...');
        const backupAudio = new Audio(`${baseUrl}/sounds/grunt.mp3`);
        backupAudio.volume = 0.5;
        
        backupAudio.addEventListener('canplaythrough', () => {
          setAudioStatus(`Backup audio loaded successfully from ${backupAudio.src}`);
          backupAudio.play()
            .then(() => {
              setAudioStatus(`Backup audio played successfully`);
            })
            .catch(err => {
              setAudioStatus(`Backup play error: ${err.message}`);
            });
        });
        
        backupAudio.addEventListener('error', () => {
          setAudioStatus('Both audio locations failed to load');
        });
      });
      
      // Add a timeout in case nothing happens
      setTimeout(() => {
        if (audioStatus.includes('Testing')) {
          setAudioStatus('Timeout - no response from audio');
        }
      }, 3000);
    } catch (e) {
      setAudioStatus(`Creation error: ${e}`);
    }
  };
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/IntroBackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <Card className="relative w-[90%] max-w-md border-2 border-amber-800 bg-black/50 text-white shadow-2xl z-10">
        <CardContent className="pt-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-amber-500">High Noon Hustle</h1>
          <p className="mb-4 text-amber-200">
            Collect money bags, dodge wild west obstacles, and escape the sheriff across 3 thrilling levels. You have limited lives—use them wisely!
          </p>

          <div className="mb-6 text-left bg-black/40 border border-amber-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2 text-amber-300">How to Play:</h2>
            <ul className="list-disc pl-5 text-amber-200">
              <li>Use arrow keys or WASD to move your cowboy</li>
              <li>Dodge horses, trains, and wild west obstacles</li>
              <li>Collect money bags for extra points</li>
              <li>Escape the sheriff by reaching the safe zones</li>
              <li>Complete all 3 thrilling levels to win</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center space-y-3">
          <Button 
            size="lg" 
            className="w-[200px] bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
            onClick={onStart}
          >
            Start Game
          </Button>
          
          {/* Audio test section */}
          <div className="w-full text-center">
            <div className="flex justify-center space-x-2 mb-2">
              <Button 
                className="bg-slate-700 hover:bg-slate-600"
                onClick={testAudio}
              >
                Test Single
              </Button>
              <Button 
                className="bg-slate-700 hover:bg-slate-600"
                onClick={testAllAudioFiles}
              >
                Test All
              </Button>
            </div>
            <pre className="text-sm text-amber-200 max-h-24 overflow-y-auto bg-black/30 p-2 rounded">
              {audioStatus}
            </pre>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StartScreen;
