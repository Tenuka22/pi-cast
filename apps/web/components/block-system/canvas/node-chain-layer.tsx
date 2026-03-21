/**
 * Node Chain Layer Component
 * 
 * Renders the node chain connection layer on top of the block canvas.
 * Shows chain flow indicators and connection handles.
 */

'use client';

import React from 'react';
import type { NodeChain, Block } from '@/lib/block-system/types';
import {
  NodeChainIndicator,
  ChainPathHighlight,
  ChainMiniMap,
} from './node-chain-visualization';

interface NodeChainLayerProps {
  nodeChains: Map<string, NodeChain>;
  blocks: Block[];
  selectedChainId?: string;
  isConnecting?: boolean;
  connectingFromChainId?: string;
  onConnectStart?: (chainId: string) => void;
  onConnectEnd?: (sourceChainId: string, targetChainId: string) => void;
  onSelectChain?: (chainId: string) => void;
}

export function NodeChainLayer({
  nodeChains,
  blocks,
  selectedChainId,
  isConnecting = false,
  connectingFromChainId,
  onConnectStart,
  onConnectEnd,
  onSelectChain,
}: NodeChainLayerProps) {
  // Convert blocks array to map for quick lookup
  const blockMap = React.useMemo(() => {
    const map = new Map<string, Block>();
    blocks.forEach((b) => map.set(b.id, b));
    return map;
  }, [blocks]);

  // Get the selected chain
  const selectedChain = selectedChainId ? nodeChains.get(selectedChainId) : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {/* Highlight chain path when a chain is selected */}
      {selectedChain && (
        <ChainPathHighlight
          chainId={selectedChainId!}
          allChains={nodeChains}
          blocks={blockMap}
        />
      )}

      {/* Render chain indicators for each node */}
      {Array.from(nodeChains.values()).map((chain) => (
        <div
          key={chain.id}
          className="pointer-events-auto"
        >
          <NodeChainIndicator
            chain={chain}
            allChains={nodeChains}
            blocks={blockMap}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            isConnecting={isConnecting}
            connectingFromChainId={connectingFromChainId}
          />
        </div>
      ))}

      {/* Mini map showing chain structure */}
      {nodeChains.size > 0 && (
        <ChainMiniMap
          chains={nodeChains}
          blocks={blockMap}
          selectedChainId={selectedChainId}
          onSelectChain={onSelectChain}
        />
      )}
    </div>
  );
}
