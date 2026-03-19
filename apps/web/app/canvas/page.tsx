import { GridCanvas } from '@/components/blocks/grid-canvas';
import { BlockLibrary } from '@/components/blocks/block-library';
import type { BlockPreset } from '@/components/blocks/block-library';
import type { Block } from '@/lib/block-system/types';

/**
 * Canvas Page - Main workspace for creating and editing block-based lessons.
 */
export default function CanvasPage() {
  const handleBlockSelect = (preset: BlockPreset) => {
    console.log('Block selected from library:', preset);
  };

  const handleBlocksChange = (blocks: Block[]) => {
    console.log('Blocks updated:', blocks.length);
  };

  return (
    <div className="flex h-screen w-full">
      <BlockLibrary onBlockSelect={handleBlockSelect} />
      <div className="flex-1">
        <GridCanvas onBlocksChange={handleBlocksChange} />
      </div>
    </div>
  );
}
