import { Box, Database, ListOrdered, Network, Zap } from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const DeploymentToolbar = ({ serviceId }) => {
  const { addNode } = useProjectStore();

  const handleAddNode = (nodeType, defaultData) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100
    };
    addNode(serviceId, nodeType, position, defaultData);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleAddNode('deployment-container', {
            name: 'New Container',
            image: 'nginx:latest',
            ports: ['80:80'],
            environment: [],
            replicas: 1
          })}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
        >
          <Box className="w-4 h-4" />
          Add Container
        </button>

        <button
          onClick={() => handleAddNode('deployment-database', {
            name: 'Database',
            engine: 'PostgreSQL',
            version: '15',
            storage: '20GB',
            backup: true
          })}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
        >
          <Database className="w-4 h-4" />
          Add Database
        </button>

        <button
          onClick={() => handleAddNode('deployment-queue', {
            name: 'Message Queue',
            type: 'RabbitMQ',
            maxSize: '10000',
            deadLetterQueue: true
          })}
          className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
        >
          <ListOrdered className="w-4 h-4" />
          Add Queue
        </button>

        <button
          onClick={() => handleAddNode('deployment-loadbalancer', {
            name: 'Load Balancer',
            type: 'Application',
            algorithm: 'Round Robin',
            healthCheck: true
          })}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
        >
          <Network className="w-4 h-4" />
          Add Load Balancer
        </button>

        <button
          onClick={() => handleAddNode('deployment-cache', {
            name: 'Cache',
            engine: 'Redis',
            ttl: '3600s',
            evictionPolicy: 'LRU'
          })}
          className="flex items-center gap-2 px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
        >
          <Zap className="w-4 h-4" />
          Add Cache
        </button>
      </div>
    </div>
  );
};

export default DeploymentToolbar;