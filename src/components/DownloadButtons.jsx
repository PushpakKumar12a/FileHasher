import { jsPDF } from 'jspdf'
import {FileText, File } from 'lucide-react'

const DownloadButtons = ({ item }) => {
  const type = item.result.file_type || item.file.type || 'Unknown'
  const sizeKB = (item.file.size / 1024).toFixed(2)

  const downloadText = () => {
    let text = "=================================================\n"
    text += "               FILE HASH REPORT\n"
    text += "=================================================\n\n"
    text += `Filename: ${item.result.filename}\n`
    text += `Type:     ${type}\n`
    text += `Size:     ${item.file.size} bytes (${sizeKB} KB)\n`
    text += "-------------------------------------------------\n"
    text += `SHA-256: ${item.result.sha256}\n`
    text += `SHA-512: ${item.result.sha512}\n`
    text += `SHA-1:   ${item.result.sha1}\n`
    text += `MD5:     ${item.result.md5}`
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.result.filename}_hashes.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const startY = 60

    // --- Header ---
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text("File Hash Report", 20, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.setFont('helvetica', 'normal')
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 180, 20, { align: 'right' })

    // --- File Metadata Section ---
    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text(`File: ${item.result.filename}`, 20, 40)
    
    doc.setFontSize(11)
    doc.setTextColor(90, 90, 90)
    doc.text(`Type: ${type}`, 20, 48)
    doc.text(`Size: ${item.file.size} bytes (${sizeKB} KB)`, 100, 48)

    // --- Hashes Table Section ---
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text("Cryptographic Hashes", 20, startY)

    let currentY = startY + 10;
    const leftColX = 20;
    const rightColX = 50;
    const lineHeight = 7;
    
    const hashes = [
      { label: 'SHA-256', value: item.result.sha256 },
      { label: 'SHA-512', value: item.result.sha512 },
      { label: 'SHA-1', value: item.result.sha1 },
      { label: 'MD5', value: item.result.md5 },
    ];

    hashes.forEach(hash => {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${hash.label}:`, leftColX, currentY)
      doc.setFont('courier', 'normal')
      const lines = doc.splitTextToSize(hash.value, 140);
      
      doc.text(lines, rightColX, currentY); 
      currentY += lines.length * lineHeight;
      currentY += 2; 
    });
    
    doc.save(`${item.result.filename}_hashes.pdf`)
  }

  return (
    <div className="flex space-x-2 pt-2">
      <button 
        onClick={(e) => { e.stopPropagation(); downloadText(); }}
        className="flex items-center justify-center gap-1.5 flex-1 py-1.5 px-3 text-sm font-medium 
                   text-gray-300 bg-gray-700 border border-gray-600 
                   hover:bg-gray-600 hover:text-white transition-colors 
                   rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
        title="Download hash data as a plain text (.txt) file"
      >
        <FileText size={16} /> 
        TXT Report
      </button>

      <button 
        onClick={(e) => { e.stopPropagation(); downloadPDF(); }}
        className="flex items-center justify-center gap-1.5 flex-1 py-1.5 px-3 text-sm font-semibold 
                   bg-blue-600 text-white shadow-md hover:bg-blue-500 
                   transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        title="Download a formatted report as a PDF file"
      >
        <File size={16} /> 
        PDF Report
      </button>
    </div>
  )
}

export default DownloadButtons