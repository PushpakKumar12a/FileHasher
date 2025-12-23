import { Shield } from 'lucide-react'

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between mb-12 p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Shield className="text-blue-500" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-100">Hashner</h1>
          <p className="text-xs text-gray-400">Secure File Hasher</p>
        </div>
      </div>
      
      <div className="hidden sm:block">
        <span className="text-xs font-mono text-gray-500 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700/50">
          v1.0.0
        </span>
      </div>
    </nav>
  )
}

export default Navbar
