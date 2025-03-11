'use client'
// components/EditorLayout.tsx
import React, { useState, useEffect } from 'react'
import { get, set } from 'idb-keyval'
import { motion } from 'framer-motion'
import {
  IconPlayerPlay,
  IconSettings,
  IconCircleDotted,
} from '@tabler/icons-react'
import dynamic from 'next/dynamic'
import * as monaco from 'monaco-editor' // Import Monaco types for theme definition and editor instance

// Dynamically import the Monaco Editor with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false, // Prevents server-side rendering of the editor
})

const EditorLayout: React.FC = () => {
  const [splitPercentage, setSplitPercentage] = useState(50)
  const [isMobile, setIsMobile] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [errorLine, setErrorLine] = useState<number | null>(null)
  const editorRef = React.useRef<monaco.editor.ICodeEditor | null>(null) // Properly typed editor reference

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load saved split percentage from IndexedDB
  useEffect(() => {
    const key = isMobile ? 'panelHeight' : 'panelWidth'
    get(key).then((savedValue) => {
      if (savedValue) {
        setSplitPercentage(savedValue)
      } else {
        setSplitPercentage(50) // Default value
      }
    })
  }, [isMobile])

  // Handle panel resizing
  const handleDrag = (e: MouseEvent) => {
    if (isMobile) {
      const totalHeight = window.innerHeight
      const newHeight = (e.clientY / totalHeight) * 100
      if (newHeight >= 20 && newHeight <= 80) {
        setSplitPercentage(newHeight)
        set('panelHeight', newHeight)
      }
    } else {
      const totalWidth = window.innerWidth
      const newWidth = (e.clientX / totalWidth) * 100
      if (newWidth >= 20 && newWidth <= 80) {
        setSplitPercentage(newWidth)
        set('panelWidth', newWidth)
      }
    }
  }

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    document.addEventListener('mousemove', handleDrag as EventListener)
    document.addEventListener(
      'mouseup',
      () => {
        document.removeEventListener('mousemove', handleDrag as EventListener)
      },
      { once: true }
    )
  }

  // Function to run the code and capture console output
  const runCode = () => {
    if (!editorRef.current) return // Guard against null reference
    const code = editorRef.current.getValue()
    if (!code) return

    const originalConsoleLog = console.log
    const logs: string[] = []

    console.log = (...args: any[]) => {
      logs.push(args.map(String).join(' '))
    }

    try {
      const result = new Function(code)()
      setConsoleOutput(logs.length > 0 ? logs.join('\n') : String(result))
      setErrorLine(null)
    } catch (error) {
      setConsoleOutput(String(error))
      setErrorLine(1) // Placeholder for error line
    } finally {
      console.log = originalConsoleLog
    }
  }

  // Define the custom theme with additional highlight overrides
  const defineCustomTheme = (monacoInstance: typeof monaco) => {
    monacoInstance.editor.defineTheme('customLight', {
      base: 'vs', // Based on the Visual Studio light theme
      inherit: true, // Inherit other styles from the base theme
      rules: [], // No additional token rules needed
      colors: {
        'editor.background': '#f0f0f0', // Set background color to #f0f0f0
        'editor.selectionBackground': '#f0f0f0', // Match background for selection
        'editor.lineHighlightBackground': '#f0f0f0', // Match background for current line
        'editor.wordHighlightBackground': '#f0f0f0', // Match background for word under cursor
        'editor.wordHighlightStrongBackground': '#f0f0f0', // Match background for strong word highlight
      },
    })
  }

  return (
    <div
      className="h-screen p-2 gap-2 w-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '100%'
          : `${splitPercentage}% 1px ${100 - splitPercentage}%`,
        gridTemplateRows: isMobile
          ? `${splitPercentage}% 1px ${100 - splitPercentage}%`
          : '100%',
        backgroundColor: 'var(--background)',
      }}>
      {/* Editor Panel */}
      <motion.div
        className="rounded-lg shadow-lg p-4 relative"
        style={{ backgroundColor: 'var(--panel-bg)' }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}>
        <div className="mt-5 h-full">
          <Editor
            height="80%"
            defaultLanguage="javascript"
            defaultValue="// Write your code here"
            theme="customLight" // Use the custom theme
            options={{
              fontFamily: 'firaCode',
              fontSize: 14,
              minimap: { enabled: false },
              hideCursorInOverviewRuler: true,
              scrollBeyondLastLine: false,
              selectionHighlight: false, // Disables matching selection highlights
              renderLineHighlight: 'none', // Disables current-line highlight
              selectOnLineNumbers: false, // Prevents selecting on line number click
              selectionClipboard: false, // Prevents copying selected text to clipboard
              foldingHighlight: false, // Disables folding highlights
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                verticalSliderSize: 0,
                verticalScrollbarSize: 0,
              },
            }}
            onMount={(editor, monacoInstance) => {
              editorRef.current = editor
              defineCustomTheme(monacoInstance) // Define the custom theme
              monacoInstance.editor.setTheme('customLight') // Apply the custom theme

              // Prevent text selection by resetting it to a cursor position
              editor.onDidChangeCursorSelection(() => {
                const selection = editor.getSelection()
                if (selection && !selection.isEmpty()) {
                  const position = selection.getStartPosition()
                  editor.setSelection(
                    new monacoInstance.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    )
                  )
                }
              })
            }}
          />
        </div>
        <motion.div
          className="absolute top-2 left-2"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 1 }}>
          <IconCircleDotted
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
        <motion.div
          className="absolute top-2 right-2"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 1 }}
          onClick={runCode}>
          <IconPlayerPlay
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
        <motion.div
          className="absolute bottom-2 left-2"
          whileHover={{ scale: 1.1 }} transition={{ duration: 1 }}>
            
          <IconCircleDotted
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div
        className={`w-[2px] ${isMobile ? 'cursor-row-resize' : 'cursor-col-resize'}`}
        style={{
          backgroundColor: 'var(--divider)',
          borderRadius: '4px',
        }}
        onMouseDown={startDragging}
      />

      {/* Console Panel */}
      <motion.div
        className="rounded-lg shadow-lg p-4 mr-3 relative"
        style={{ backgroundColor: 'var(--panel-bg)' }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}>
        <div
          className={`h-80 text-gray-800 mt-5 rounded overflow-auto ${errorLine ? 'bg-red-100' : ''}`}
          style={{
            fontFamily: 'var(--font-fira-code)',
            fontSize: '14px',
            backgroundColor: 'var(--background)',
          }}>
          {consoleOutput || 'Run your code to see output here'}
        </div>
        <motion.div
          className="absolute top-2 right-2"
          whileHover={{ scale: 1.1 }} transition={{ duration: 1 }}>
          <IconCircleDotted
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
        <motion.div
          className="absolute bottom-2 right-2"
          whileHover={{ scale: 1.1 }} transition={{ duration: 1 }}>
          <IconSettings
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
        <motion.div
          className="absolute bottom-2 left-2 "
          whileHover={{ scale: 1.1 }} transition={{ duration: 1 }}>
          <IconCircleDotted
            className="text-black hover:text-white hover:bg-black p-1 rounded transition-all duration-1000 ease-in-out"
            size={24}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EditorLayout
