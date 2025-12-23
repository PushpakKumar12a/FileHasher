import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import FileCard from './components/FileCard'
import DownloadAllButtons from './components/DownloadAllButtons'
import Navbar from './components/Navbar'
import { hashFile } from './hashFile.js'
import './App.css'

function App() {
  const [filesList, setFilesList] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [expandedCards, setExpandedCards] = useState(new Set())

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const processFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
      result: null,
      error: null
    }))
    
    setFilesList(prev => [...newFiles, ...prev])
    newFiles.forEach(fileItem => uploadFile(fileItem))
  }

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files)
    }
  }

  const uploadFile = async (fileItem) => {
    setFilesList(prev => prev.map(item => 
      item.id === fileItem.id ? { ...item, status: 'uploading' } : item
    ))

    try {
      const result = await hashFile(fileItem.file, {
        onProgress: (percentCompleted) => {
          setFilesList(prev => prev.map(item =>
            item.id === fileItem.id ? { ...item, progress: percentCompleted } : item
          ))
        }
      })

      setFilesList(prev => prev.map(item => 
        item.id === fileItem.id ? { 
          ...item, 
          status: 'completed', 
          result,
          progress: 100 
        } : item
      ))
      
      setExpandedCards(prev => new Set(prev).add(fileItem.id))
      
    } catch (err) {
      setFilesList(prev => prev.map(item => 
        item.id === fileItem.id ? { 
          ...item, 
          status: 'error', 
          error: err?.message || 'Hashing failed' 
        } : item
      ))
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-5 font-sans">
      <div className="max-w-4xl mx-auto">
        <Navbar />
        <div 
          className={`mb-12 p-10 border-2 border-dashed rounded-2xl text-center transition-all duration-300 ease-in-out
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
              : 'border-gray-700 bg-gray-800/50 hover:border-blue-500/50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold mb-2">Drag & Drop files here</h3>
          <p className="text-gray-500 mb-6">or click to browse from your computer</p>
          <label className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-lg shadow-blue-900/20">
            Select Files
            <input type="file" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {filesList.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
              <h2 className="text-2xl font-semibold text-gray-200">Processed Files</h2>
              <DownloadAllButtons filesList={filesList} />
            </div>

            <div className="space-y-4">
              {filesList.map(item => (
                <FileCard 
                  key={item.id}
                  item={item}
                  isExpanded={expandedCards.has(item.id)}
                  onToggle={toggleCard}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
