import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { LoginModalProvider } from './contexts/LoginModalContext';

function App() {
  useEffect(() => {
    document.title = 'SingularityWalk';
  }, []);

  return (
    <LoginModalProvider>
      <RouterProvider router={router} />
    </LoginModalProvider>
  );
}

export default App;
