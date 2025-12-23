import { Download, FileText, File } from 'lucide-react'
import { jsPDF } from 'jspdf'

const DownloadAllButtons = ({ filesList }) => {

  const downloadAllText = () => {
    const completedFiles = filesList.filter(f => f.status === 'completed' && f.result)
    if (!completedFiles.length) return

    let content = "========================================================================\n"
    content += "                          FULL HASH REPORT\n"
    content += "========================================================================\n\n"

    completedFiles.forEach((item, index) => {
      const type = item.result.file_type || item.file.type || 'Unknown'
      const sizeKB = (item.file.size / 1024).toFixed(2)

      content += `[ FILE #${index + 1} ]\n`
      content += `Filename: ${item.result.filename}\n`
      content += `Type:     ${type}\n`
      content += `Size:     ${item.file.size} bytes (${sizeKB} KB)\n`
      content += "------------------------------------------------------------------------\n"

      // Hash Block
      content += `SHA-256: ${item.result.sha256}\n`
      content += `SHA-512: ${item.result.sha512}\n`
      content += `SHA-1:   ${item.result.sha1}\n`
      content += `MD5:     ${item.result.md5}\n\n`

      if (index < completedFiles.length - 1) {
        content += "========================================================================\n\n"
      }
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all_files_hashes_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAllPDF = () => {
    const completedFiles = filesList.filter(f => f.status === 'completed' && f.result)
    if (!completedFiles.length) return

    const doc = new jsPDF()
    const startY = 60

    completedFiles.forEach((item, index) => {
      if (index > 0) doc.addPage()
      
      const type = item.result.file_type || item.file.type || 'Unknown'
      const sizeKB = (item.file.size / 1024).toFixed(2)

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
      
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')
      doc.text("Cryptographic Hashes", 20, startY)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      let currentY = startY + 10;
      const leftColX = 20;
      const rightColX = 50;
      const lineHeight = 7;
      
      // Hash rows
      const hashes = [
        { label: 'SHA-256', value: item.result.sha256 },
        { label: 'SHA-512', value: item.result.sha512 },
        { label: 'SHA-1', value: item.result.sha1 },
        { label: 'MD5', value: item.result.md5 },
      ];

      doc.setFont('courier', 'normal')
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
      
      if (index === completedFiles.length - 1) {
          doc.setFontSize(9)
          doc.setTextColor(150)
          doc.text("End of Report", 105, 280, { align: 'center' })
      }
    })
    
    doc.save(`all_files_hashes_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  if (!filesList.some(f => f.status === 'completed')) return null

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-lg w-full sm:w-auto">
      <div className="text-gray-400 text-sm font-semibold flex items-center gap-1">
        <Download size={18} className="text-blue-400" />
        Download Full Report:
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        {/* Text Report Button (Secondary Style) */}
        <button 
          onClick={downloadAllText}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                     text-gray-300 bg-gray-700 border border-gray-600 
                     hover:bg-gray-600 hover:text-white transition-colors 
                     rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
          title="Download all hash data as a plain text (.txt) file"
        >
          <FileText size={16} /> 
          TXT Report
        </button>

        {/* PDF Report Button (Primary Style) */}
        <button 
          onClick={downloadAllPDF}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold 
                     bg-blue-600 text-white shadow-md hover:bg-blue-500 
                     transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          title="Download a formatted report for all files as a PDF file"
        >
          <File size={16} /> 
          PDF Report
        </button>
      </div>
    </div>
  )
}

export default DownloadAllButtons