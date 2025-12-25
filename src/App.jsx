import { useMemo, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import FileCard from './components/FileCard'
import DownloadAllButtons from './components/DownloadAllButtons'
import Navbar from './components/Navbar'
import { hashFile } from './hashFile.js'
import { compCurrToPrev, parsePrevReport } from './reportMatcher.js'
import { extractTextFromPdf } from './pdfExtract.js'
import './App.css'

function App() {
  const [filesList, setFilesList] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [prevReport, setPrevReport] = useState(null)
  const [prevReportError, setPrevReportError] = useState(null)

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

  const handlePrevReportChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setPrevReportError(null)

    if (!file) return

    try {
      const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase?.().endsWith('.pdf')
      const text = isPdf ? await extractTextFromPdf(file) : await file.text()
      const parsed = parsePrevReport(text)
      if (!parsed.entriesByFilename || parsed.entriesByFilename.size === 0) {
        throw new Error('Could not find any hash entries in that report.')
      }

      setPrevReport({
        name: file.name,
        format: isPdf ? 'pdf' : parsed.format,
        entriesByFilename: parsed.entriesByFilename
      })
    } catch (err) {
      setPrevReport(null)
      setPrevReportError(err?.message || 'Failed to read/parse previous report.')
    }
  }

  const clearPreviousReport = () => {
    setPrevReport(null)
    setPrevReportError(null)
  }

  const comparison = useMemo(() => {
    if (!prevReport?.entriesByFilename) return null
    const currentItems = filesList.filter(f => f.status === 'completed' && f.result)
    return compCurrToPrev({
      currentItems,
      prevByFilename: prevReport.entriesByFilename
    })
  }, [filesList, prevReport])

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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="flex-1 sm:flex-none inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium rounded-lg cursor-pointer transition-colors border border-gray-600">
                    Load Previous Report
                    <input
                      type="file"
                      accept=".txt,.json,.pdf,application/json,text/plain,application/pdf"
                      onChange={handlePrevReportChange}
                      className="hidden"
                    />
                  </label>

                  {prevReport && (
                    <button
                      onClick={clearPreviousReport}
                      className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
                      title="Clear the loaded previous report"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <DownloadAllButtons filesList={filesList} />
              </div>
            </div>

            {prevReportError && (
              <div className="text-red-400 bg-red-900/10 p-4 rounded-lg border border-red-900/20">
                {prevReportError}
              </div>
            )}

            {prevReport && comparison && (
              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl text-sm text-gray-300">
                <div className="font-semibold text-gray-200 mb-1">
                  Comparison loaded: <span className="font-mono text-gray-300">{prevReport.name}</span>
                  <span className="text-gray-500 font-normal"> ({prevReport.format.toUpperCase()})</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400">
                  <span>Verified: <span className="text-green-400 font-semibold">{comparison.summary.verified}</span></span>
                  <span>Tampered: <span className="text-red-400 font-semibold">{comparison.summary.tampered}</span></span>
                  <span>New: <span className="text-yellow-400 font-semibold">{comparison.summary.newFiles}</span></span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filesList.map(item => (
                <FileCard 
                  key={item.id}
                  item={item}
                  isExpanded={expandedCards.has(item.id)}
                  onToggle={toggleCard}
                  integrity={comparison?.integrityById?.[item.id] || null}
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
