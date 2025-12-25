import { FileText, ChevronDown } from 'lucide-react'
import DownloadButtons from './DownloadButtons'

const FileCard = ({ item, isExpanded, onToggle, integrity }) => {
  const integrityBadge = (() => {
    if (!integrity) return null
    if (integrity.state === 'verified') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-green-900/30 text-green-400 border border-green-900">
          verified
        </span>
      )
    }
    if (integrity.state === 'tampered') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-red-900/30 text-red-400 border border-red-900">
          tampered
        </span>
      )
    }
    if (integrity.state === 'new') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-yellow-900/30 text-yellow-400 border border-yellow-900">
          new
        </span>
      )
    }
    if (integrity.state === 'unknown') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-gray-900/30 text-gray-300 border border-gray-700">
          unknown
        </span>
      )
    }
    return null
  })()

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => onToggle(item.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2 bg-gray-700/50 rounded-lg">
              <FileText className="text-blue-400" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium truncate text-gray-200">{item.file.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide
                  ${item.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-900' : 
                    item.status === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900' : 
                    'bg-blue-900/30 text-blue-400 border border-blue-900'}`}>
                  {item.status}
                </span>
                {integrityBadge}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                {item.result?.file_type && (
                  <>
                    <span>•</span>
                    <span>{item.result.file_type}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pl-4">
            {item.status === 'uploading' && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                  <div 
                    className="h-full bg-blue-600 animate-stripes transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-400 w-10 text-right">{item.progress}%</span>
              </div>
            )}
            <ChevronDown className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} size={20} />
          </div>
        </div>

        {/* Mobile Loading Bar */}
        {item.status === 'uploading' && (
          <div className="mt-3 sm:hidden flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div 
                className="h-full bg-blue-600 animate-stripes transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-8 text-right">{item.progress}%</span>
          </div>
        )}
      </div>

      {/* Card Body - Collapsible */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-gray-800/50 p-6 animate-in slide-in-from-top-2 duration-200">
          {item.status === 'error' ? (
            <div className="text-red-400 bg-red-900/10 p-4 rounded-lg border border-red-900/20">
              Error: {item.error}
            </div>
          ) : item.result ? (
            <div className="space-y-4">
              {integrity && (
                <div className={`p-3 rounded-lg border text-sm 
                  ${integrity.state === 'verified' ? 'bg-green-900/10 border-green-900/20 text-green-300' :
                    integrity.state === 'tampered' ? 'bg-red-900/10 border-red-900/20 text-red-300' :
                    integrity.state === 'new' ? 'bg-yellow-900/10 border-yellow-900/20 text-yellow-300' :
                    'bg-gray-900/10 border-gray-700/30 text-gray-300'}`}>
                  <span className="font-semibold">Comparison:</span>{' '}
                  {integrity.state === 'verified'
                    ? 'Matches previous report.'
                    : integrity.state === 'tampered'
                      ? 'Does NOT match previous report (possible tampering).'
                      : integrity.state === 'new'
                        ? 'Not found in previous report.'
                        : 'Could not compare (no matching hashes parsed from the report).'}
                </div>
              )}
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MD5</label>
                  <div className="font-mono text-sm bg-gray-900/50 p-3 rounded-lg text-gray-300 break-all border border-gray-700/50 select-all">
                    {item.result.md5}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SHA-1</label>
                  <div className="font-mono text-sm bg-gray-900/50 p-3 rounded-lg text-gray-300 break-all border border-gray-700/50 select-all">
                    {item.result.sha1}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SHA-256</label>
                  <div className="font-mono text-sm bg-gray-900/50 p-3 rounded-lg text-gray-300 break-all border border-gray-700/50 select-all">
                    {item.result.sha256}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SHA-512</label>
                  <div className="font-mono text-sm bg-gray-900/50 p-3 rounded-lg text-gray-300 break-all border border-gray-700/50 select-all">
                    {item.result.sha512}
                  </div>
                </div>
              </div>
              
              <DownloadButtons item={item} />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Processing file...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileCard
