"use client";
// components/EditorLayout.tsx
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

const EditorLayout: React.FC = () => {
  // State for split percentage (default to 50 for equal sizes)
  const [splitPercentage, setSplitPercentage] = useState(50);
  // State to detect mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view based on screen width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load saved split percentage from IndexedDB
  useEffect(() => {
    const key = isMobile ? 'panelHeight' : 'panelWidth';
    get(key).then((savedValue) => {
      if (savedValue) {
        setSplitPercentage(savedValue);
      } else {
        setSplitPercentage(50); // Default to equal sizes
      }
    });
  }, [isMobile]);

  // Handle dragging for resizing panels
  const handleDrag = (e: MouseEvent) => {
    if (isMobile) {
      const totalHeight = window.innerHeight;
      const newHeight = (e.clientY / totalHeight) * 100;
      if (newHeight >= 20 && newHeight <= 80) {
        setSplitPercentage(newHeight);
        set('panelHeight', newHeight);
      }
    } else {
      const totalWidth = window.innerWidth;
      const newWidth = (e.clientX / totalWidth) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setSplitPercentage(newWidth);
        set('panelWidth', newWidth);
      }
    }
  };

  // Start dragging on divider click
  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleDrag as EventListener);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleDrag as EventListener);
    }, { once: true });
  };

  return (
    <div
      className="h-screen bg-gray-200 p-[2vw]"
      style={{
        display: 'grid',
        // Desktop: horizontal layout; Mobile: vertical layout
        gridTemplateColumns: isMobile
          ? '100%'
          : `${splitPercentage}% 2px ${100 - splitPercentage}%`,
        gridTemplateRows: isMobile
          ? `${splitPercentage}% 2px ${100 - splitPercentage}%`
          : '100%',
        backgroundColor: 'var(--background)'
      }}
    >
      {/* Editor Panel */}
      <div className="rounded-lg shadow-md overflow-auto mr-3"
        style={{ backgroundColor: 'var(--panel-bg)' }}
      >
        Editor Panel
      </div>

      {/* Divider */}
      <div
        className={` w-2.5  ${
          isMobile ? 'cursor-row-resize' : 'cursor-col-resize'
        }`}
        style={{ backgroundColor: 'var(--divider)' }}
        onMouseDown={startDragging}
      />

      {/* Console Panel */}
      <div className=" rounded-lg shadow-md overflow-auto ml-5"
      style={{ backgroundColor: 'var(--panel-bg)' }}>
        Console Panel
      </div>
    </div>
  );
};

export default EditorLayout;