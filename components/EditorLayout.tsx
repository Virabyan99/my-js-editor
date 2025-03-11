"use client";
// components/EditorLayout.tsx
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { motion } from 'framer-motion';

const EditorLayout: React.FC = () => {
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
        setSplitPercentage(50); // Default value
      }
    });
  }, [isMobile]);

  // Handle panel resizing
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

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleDrag as EventListener);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleDrag as EventListener);
    }, { once: true });
  };

  return (
    <div
      className="h-screen p-4 gap-2 w-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '100%' : `${splitPercentage}% 2px ${100 - splitPercentage}%`,
        gridTemplateRows: isMobile ? `${splitPercentage}% 2px ${100 - splitPercentage}%` : '100%',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Editor Panel */}
      <motion.div
        className="rounded-lg shadow-lg p-4 flex justify-center items-center"
        style={{ backgroundColor: 'var(--panel-bg)' }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-xl text-gray-700">Editor Panel</div>
      </motion.div>

      {/* Divider */}
      <div
        className={`w-2 ${isMobile ? 'cursor-row-resize' : 'cursor-col-resize'}`}
        style={{
          backgroundColor: 'var(--divider)',
          borderRadius: '4px',
        }}
        onMouseDown={startDragging}
      />

      {/* Console Panel */}
      <motion.div
        className="rounded-lg shadow-lg p-4 flex justify-center items-center ml-2 mr-3"
        style={{ backgroundColor: 'var(--panel-bg)' }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-xl text-gray-700">Console Panel</div>
      </motion.div>
    </div>
  );
};

export default EditorLayout;
