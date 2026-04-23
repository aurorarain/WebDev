import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

function App() {
  useEffect(() => {
    document.title = 'SingularityWalk';
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
