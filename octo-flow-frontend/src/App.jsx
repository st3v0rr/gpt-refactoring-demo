import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ServiceLandscape from './components/ServiceLandscape/ServiceLandscape';
import ServiceDetailView from './components/ServiceDetail/ServiceDetailView';
import useProjectStore from './store/projectStore';

function App() {
  const { loadProject } = useProjectStore();

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ServiceLandscape />} />
        <Route path="/service/:serviceId" element={<ServiceDetailView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;