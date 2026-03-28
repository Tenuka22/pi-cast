/**
 * Node Chain Visualization Component
 * 
 * Renders visual indicators for node chain connections:
 * - Chain flow indicators (arrows showing data flow)
 * - Input/output handles with chain awareness
 * - Chain path highlighting
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import type { NodeChain, Block, GridPosition } from '@/lib/block-system/types';
import { GRID_UNIT } from '@/lib/block-system/types';

interface NodeChainIndicatorProps {
  chain: NodeChain;
  allChains: Map<string, NodeChain>;
  blocks: Map<string, Block>;
  onConnectStart?: (chainId: string) => void;
  onConnectEnd?: (sourceChainId: string, targetChainId: string) => void;
  isConnecting?: boolean;
  connectingFromChainId?: string;
}

/**
 * Visual indicator showing a node's position in a chain
 */
export function NodeChainIndicator({
  chain,
  allChains,
  blocks,
  onConnectStart,
  onConnectEnd,
  isConnecting = false,
  connectingFromChainId,
}: NodeChainIndicatorProps) {
  const prevChain = chain.prev ? allChains.get(chain.prev) : null;
  const nextChains = chain.next.map((id) => allChains.get(id)).filter((c): c is NodeChain => !!c);

  const block = blocks.get(chain.nodeId);
  if (!block) return null;

  // Input handle (top center) - receives from prev
  const inputPos: GridPosition = {
    x: block.position.x + Math.floor(block.dimensions.width / 2),
    y: block.position.y,
  };

  // Output handle (bottom center) - sends to next
  const outputPos: GridPosition = {
    x: block.position.x + Math.floor(block.dimensions.width / 2),
    y: block.position.y + block.dimensions.height,
  };

  const canConnectInput = isConnecting && connectingFromChainId !== chain.id;
  const canConnectOutput = !isConnecting;

  return (
    <>
      {/* Input Handle (receives data from previous node) */}
      <div
        className={cn(
          'absolute z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
          prevChain
            ? 'border-primary bg-primary/20'
            : 'border-muted-foreground/50 bg-background',
          canConnectInput && 'cursor-copy border-green-500 bg-green-500/20 animate-pulse'
        )}
        style={{
          left: inputPos.x * GRID_UNIT - GRID_UNIT,
          top: inputPos.y * GRID_UNIT - GRID_UNIT / 2,
        }}
        onClick={() => {
          if (isConnecting && connectingFromChainId) {
            onConnectEnd?.(connectingFromChainId, chain.id);
          }
        }}
        data-chain-handle="input"
        title={prevChain ? 'Connected to previous node' : 'Click to connect from previous node'}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            prevChain ? 'bg-primary' : 'bg-muted-foreground/50'
          )}
        />
      </div>

      {/* Output Handle (sends data to next nodes) */}
      <div
        className={cn(
          'absolute z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
          nextChains.length > 0
            ? 'border-primary bg-primary/20'
            : 'border-muted-foreground/50 bg-background',
          canConnectOutput && 'cursor-crosshair hover:border-primary hover:bg-primary/10'
        )}
        style={{
          left: outputPos.x * GRID_UNIT - GRID_UNIT,
          top: outputPos.y * GRID_UNIT - GRID_UNIT / 2,
        }}
        onMouseDown={() => {
          if (canConnectOutput) {
            onConnectStart?.(chain.id);
          }
        }}
        data-chain-handle="output"
        title={nextChains.length > 0 ? `Connected to ${nextChains.length} node(s)` : 'Drag to connect to next node'}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            nextChains.length > 0 ? 'bg-primary' : 'bg-muted-foreground/50'
          )}
        />
      </div>

      {/* Chain Flow Arrow (visual indicator between nodes) */}
      {prevChain && (
        <ChainConnectionArrow
          fromChain={prevChain}
          toChain={chain}
          blocks={blocks}
        />
      )}
    </>
  );
}

/**
 * Arrow indicator showing data flow between two connected chains
 */
function ChainConnectionArrow({
  fromChain,
  toChain,
  blocks,
}: {
  fromChain: NodeChain;
  toChain: NodeChain;
  blocks: Map<string, Block>;
}) {
  const fromBlock = blocks.get(fromChain.nodeId);
  const toBlock = blocks.get(toChain.nodeId);

  if (!fromBlock || !toBlock) return null;

  // Calculate arrow start and end points
  const fromX = (fromBlock.position.x + fromBlock.dimensions.width / 2) * GRID_UNIT;
  const fromY = (fromBlock.position.y + fromBlock.dimensions.height) * GRID_UNIT;
  const toX = (toBlock.position.x + toBlock.dimensions.width / 2) * GRID_UNIT;
  const toY = toBlock.position.y * GRID_UNIT;

  // Calculate arrow angle
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Don't render if too close
  if (distance < GRID_UNIT) return null;

  return (
    <div
      className="pointer-events-none absolute z-0 flex items-center justify-center"
      style={{
        left: fromX,
        top: fromY,
        width: distance,
        height: GRID_UNIT / 2,
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg)`,
      }}
    >
      {/* Connection line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 to-primary" />
      
      {/* Arrow head */}
      <div
        className="absolute right-0 h-0 w-0 border-l-[6px] border-l-primary border-y-[4px] border-y-transparent"
        style={{
          transform: 'translateX(50%)',
        }}
      />
    </div>
  );
}

/**
 * Chain path highlighter - shows the full chain path when a node is selected
 */
export function ChainPathHighlight({
  chainId,
  allChains,
  blocks,
}: {
  chainId: string;
  allChains: Map<string, NodeChain>;
  blocks: Map<string, Block>;
}) {
  const chain = allChains.get(chainId);
  if (!chain) return null;

  // Traverse backwards to get full chain path
  const chainPath: string[] = [];
  let current: NodeChain | undefined = chain;
  
  while (current) {
    chainPath.unshift(current.id);
    current = current.prev ? allChains.get(current.prev) : undefined;
  }

  // Also traverse forwards
  const forwardPath: string[] = [];
  const firstNext = chain.next.length > 0 ? chain.next[0] : undefined;
  current = firstNext ? allChains.get(firstNext) : undefined;

  while (current) {
    forwardPath.push(current.id);
    const nextId = current.next.length > 0 ? current.next[0] : undefined;
    current = nextId ? allChains.get(nextId) : undefined;
  }

  const fullPath = [...chainPath, chainId, ...forwardPath];

  return (
    <>
      {fullPath.map((id) => {
        const c = allChains.get(id);
        if (!c) return null;
        
        const block = blocks.get(c.nodeId);
        if (!block) return null;

        return (
          <div
            key={id}
            className="pointer-events-none absolute rounded-lg border-2 border-primary/30 bg-primary/5"
            style={{
              left: block.position.x * GRID_UNIT,
              top: block.position.y * GRID_UNIT,
              width: block.dimensions.width * GRID_UNIT,
              height: block.dimensions.height * GRID_UNIT,
            }}
          />
        );
      })}
    </>
  );
}

/**
 * Mini chain preview showing the data flow structure
 */
export function ChainMiniMap({
  chains,
  blocks,
  selectedChainId,
  onSelectChain,
}: {
  chains: Map<string, NodeChain>;
  blocks: Map<string, Block>;
  selectedChainId?: string;
  onSelectChain?: (chainId: string) => void;
}) {
  // Group chains by their root nodes (nodes with no prev)
  const rootChains = Array.from(chains.values()).filter((c) => !c.prev);

  if (rootChains.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 rounded-lg border border-border bg-card p-2 shadow-lg">
      <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Chain Overview</h3>
      <div className="space-y-2">
        {rootChains.map((root) => (
          <ChainTree
            key={root.id}
            chainId={root.id}
            allChains={chains}
            blocks={blocks}
            selectedChainId={selectedChainId}
            onSelectChain={onSelectChain}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function ChainTree({
  chainId,
  allChains,
  blocks,
  selectedChainId,
  onSelectChain,
  depth,
}: {
  chainId: string;
  allChains: Map<string, NodeChain>;
  blocks: Map<string, Block>;
  selectedChainId?: string;
  onSelectChain?: (chainId: string) => void;
  depth: number;
}) {
  const chain = allChains.get(chainId);
  if (!chain) return null;

  const block = blocks.get(chain.nodeId);
  const isSelected = selectedChainId === chainId;

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-accent',
          isSelected && 'bg-primary/20 text-primary'
        )}
        style={{ paddingLeft: `${depth * 8 + 8}px` }}
        onClick={() => onSelectChain?.(chainId)}
      >
        <span className="font-mono">{block?.type}</span>
        {chain.next.length > 0 && (
          <span className="text-muted-foreground">→</span>
        )}
      </div>
      {chain.next.map((nextId) => (
        <ChainTree
          key={nextId}
          chainId={nextId}
          allChains={allChains}
          blocks={blocks}
          selectedChainId={selectedChainId}
          onSelectChain={onSelectChain}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
