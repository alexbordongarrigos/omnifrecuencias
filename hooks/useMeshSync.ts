import { useState, useEffect } from 'react';
import { meshNetwork, MeshNode, MeshConnectionState } from '../services/meshNetwork';

export const useMeshSync = (onDataReceive?: (data: any) => void) => {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [connectionState, setConnectionState] = useState<MeshConnectionState>(meshNetwork.state);
  const [latencyDelta, setLatencyDelta] = useState<number>(0);

  useEffect(() => {
    let unsubData: (() => void) | undefined;
    if (onDataReceive) {
      unsubData = meshNetwork.onDataReceive(onDataReceive);
    }
    const unsubNodes = meshNetwork.onNodesUpdate((updatedNodes) => {
      setNodes(updatedNodes);
      
      // Calculate a pseudo latency delta based on SNR (Signal-to-Noise Ratio) and lastHeard
      // In a real scenario, this would use NTP-like synchronization packets over the LoRa mesh.
      if (updatedNodes.length > 0) {
        // Find best node (highest SNR)
        const bestNode = updatedNodes.reduce((prev, current) => {
          return (current.snr || -100) > (prev.snr || -100) ? current : prev;
        });

        // Simular cálculo de delta en ms (tiempo que tarda la onda)
        // Ejemplo: Si el SNR es bueno, la latencia es más estable
        const baseLatency = 20; // 20ms base por serial/LoRa
        const jitter = (10 / Math.max(bestNode.snr || 1, 1)); 
        setLatencyDelta(baseLatency + jitter);
      } else {
        setLatencyDelta(0);
      }
    });

    const unsubState = meshNetwork.onStateChange((state) => {
      setConnectionState(state);
    });

    return () => {
      unsubNodes();
      unsubState();
      if (unsubData) unsubData();
    };
  }, [onDataReceive]);

  const connectToMesh = async () => {
    await meshNetwork.connect();
  };

  const disconnectFromMesh = async () => {
    await meshNetwork.disconnect();
  };

  const injectMockNode = () => {
    meshNetwork.addMockNode({
      num: '!a1b2c3d4',
      shortName: 'O-QN',
      longName: 'Omni-QuantumNode',
      lastHeard: Date.now(),
      snr: 8.5
    });
  };

  const broadcastData = async (data: any) => {
    // Inject a timestamp to the payload if it's an object, so peers can calculate latency
    const payloadWithTimestamp = (typeof data === 'object' && data !== null) ? {
      ...data,
      timestamp: Date.now()
    } : data;
    await meshNetwork.broadcastData(payloadWithTimestamp);
  };

  return {
    nodes,
    connectionState,
    latencyDelta,
    connectToMesh,
    disconnectFromMesh,
    injectMockNode,
    broadcastData
  };
};
