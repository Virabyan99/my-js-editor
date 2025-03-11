"use client";
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { motion } from 'framer-motion';

const EditorLayout: React.FC = () => {
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    setMounted(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mounted) {
      const key = isMobile ? 'panelHeight' : 'panelWidth';
      get(key).then((savedValue) => {
        if (savedValue && savedValue >= 20 && savedValue <= 80) {
          setSplitPercentage(savedValue);
        } else {
          setSplitPercentage(50);
          set(key, 50);
        }
      });
    }
  }, [isMobile, mounted]);

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
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener(
      'mouseup',
      () => {
        document.removeEventListener('mousemove', handleDrag);
      },
      { once: true }
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="flex flex-col md:flex-row h-screen p-[2vw]"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <motion.div
        style={{ flex: `0 0 ${splitPercentage}%`, backgroundColor: 'var(--panel-bg)' }}
        className="rounded-xl shadow-lg p-6 overflow-auto"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        Editor Panel
      </motion.div>
      <div
        className={`w-full h-4 md:w-8 md:h-full ${
          isMobile ? 'cursor-row-resize' : 'cursor-col-resize'
        }`}
        style={{ backgroundColor: 'var(--divider)' }}
        onMouseDown={startDragging}
      />
      <motion.div
        style={{ flex: `0 0 ${100 - splitPercentage}%`, backgroundColor: 'var(--panel-bg)' }}
        className="rounded-xl shadow-lg ml-5 p-6 overflow-auto"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        Console Panel
      </motion.div>
    </div>
  );
};

export default EditorLayout;