import React, { useEffect, useMemo, useRef } from 'react';
import PlaygroundHeader from '../../PlaygroundHeader/PlaygroundHeader';
import { useDockResize } from '@/hooks/useDockResize';
import { areaFor, readStoredNumber, writeStored } from '@/hooks/useStorage';
import type { DockMode } from '@/utils/playgroundDock';
import { StyledWrapper } from './StyledWrapper';

const HEADER_HEIGHT = 52;
const COLLAPSE_EPSILON = 8;
const getDefaultHeight = () => Math.round(window.innerHeight * 0.6);
const HEIGHT_STORAGE_KEY = 'oc-docs:playgroundBottomHeight';

interface BottomSheetDockProps {
  dock: DockMode;
  onDockChange: (dock: DockMode) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onClose: () => void;
  openNonce?: number;
  children: React.ReactNode;
}

const BottomSheetDock: React.FC<BottomSheetDockProps> = ({
  dock,
  onDockChange,
  sidebarOpen,
  onToggleSidebar,
  onClose,
  openNonce,
  children
}) => {
  const defaultHeight = getDefaultHeight();
  const initialHeight = useMemo(
    () => readStoredNumber(areaFor('session'), HEIGHT_STORAGE_KEY, getDefaultHeight()),
    []
  );
  const { size, dragging, startDrag, setSize } = useDockResize({
    axis: 'y',
    initial: initialHeight,
    min: HEADER_HEIGHT,
    max: () => window.innerHeight
  });

  const lastExpanded = useRef<number>(initialHeight);
  const collapsed = size <= HEADER_HEIGHT + COLLAPSE_EPSILON;

  const sizeRef = useRef(size);
  sizeRef.current = size;
  const defaultHeightRef = useRef(defaultHeight);
  defaultHeightRef.current = defaultHeight;

  useEffect(() => {
    if (openNonce === undefined) return;
    if (sizeRef.current <= HEADER_HEIGHT + COLLAPSE_EPSILON) setSize(defaultHeightRef.current);
  }, [openNonce, setSize]);

  useEffect(() => {
    if (!dragging && size > HEADER_HEIGHT + COLLAPSE_EPSILON) {
      writeStored(areaFor('session'), HEIGHT_STORAGE_KEY, size);
    }
  }, [dragging, size]);

  const toggleCollapse = () => {
    if (collapsed) {
      setSize(lastExpanded.current > HEADER_HEIGHT + COLLAPSE_EPSILON ? lastExpanded.current : defaultHeight);
    } else {
      lastExpanded.current = size;
      setSize(HEADER_HEIGHT);
    }
  };

  return (
    <StyledWrapper
      style={{ height: `${size}px` }}
      className={dragging ? 'dragging' : ''}
      data-testid="playground-dock-bottom-panel"
    >
      <div
        className="resize-handle"
        role="separator"
        aria-orientation="horizontal"
        onPointerDown={startDrag}
        data-testid="playground-dock-bottom-resizer"
      />
      <PlaygroundHeader
        dock={dock}
        onDockChange={onDockChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onClose={onClose}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      {!collapsed && (
        <div className="dock-content" data-testid="playground-content">
          {children}
        </div>
      )}
    </StyledWrapper>
  );
};

export default BottomSheetDock;
