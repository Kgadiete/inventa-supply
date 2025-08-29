import { useState, useEffect } from 'react';

export default function Test() {
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Test Page...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Test Page</h1>
        <p className="text-muted-foreground mb-6">
          This is a simple test page to verify the app is working correctly.
        </p>
        
        <div className="mb-6">
          <p className="text-lg font-semibold text-foreground mb-2">Counter: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mr-2"
          >
            Increment
          </button>
          <button 
            onClick={() => setCount(0)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">✅ React is working</p>
          <p className="text-sm text-muted-foreground">✅ Tailwind CSS is working</p>
          <p className="text-sm text-muted-foreground">✅ State management is working</p>
          <p className="text-sm text-muted-foreground">✅ Routing is working</p>
        </div>

        <div className="mt-6">
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors"
          >
            Go Back Home
          </a>
        </div>
      </div>
    </div>
  );
}
