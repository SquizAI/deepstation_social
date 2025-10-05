'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { validateCSVFile, readCSVFile, parseCSVToPosts, createCSVTemplate, downloadCSV } from '@/lib/utils/csv-import-export'
import { useToast } from '@/hooks/use-toast'

interface CSVImportModalProps {
  userId: string
  onImportComplete: () => void
  onClose: () => void
}

export function CSVImportModal({ userId, onImportComplete, onClose }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<{ posts: any[]; errors: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validation = validateCSVFile(selectedFile)
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)

    try {
      const content = await readCSVFile(selectedFile)
      const { posts, errors } = parseCSVToPosts(content, userId)

      setPreview({ posts, errors })

      if (errors.length > 0) {
        toast({
          title: 'CSV Parse Warnings',
          description: `${errors.length} rows have errors. Review before importing.`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Parse Error',
        description: 'Failed to parse CSV file',
        variant: 'destructive'
      })
    }
  }

  const handleImport = async () => {
    if (!preview || preview.posts.length === 0) {
      toast({
        title: 'No Posts',
        description: 'No valid posts to import',
        variant: 'destructive'
      })
      return
    }

    setImporting(true)

    try {
      const response = await fetch('/api/scheduled-posts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: preview.posts,
          filename: file?.name
        })
      })

      if (!response.ok) throw new Error('Import failed')

      const result = await response.json()

      toast({
        title: 'Import Successful',
        description: `Imported ${result.successCount} posts. ${result.failedCount} failed.`
      })

      onImportComplete()
      onClose()
    } catch (error) {
      toast({
        title: 'Import Error',
        description: 'Failed to import posts',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = createCSVTemplate()
    downloadCSV(template, 'post-import-template.csv')

    toast({
      title: 'Template Downloaded',
      description: 'CSV template downloaded successfully'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#201033] to-[#15092b] border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Import Posts from CSV</h2>
            <p className="text-gray-400 text-sm mt-1">Upload a CSV file to bulk import scheduled posts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Instructions */}
          <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">Instructions:</h3>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Download the template to see the required format</li>
              <li>Required columns: Platforms, LinkedIn Content, Twitter Content</li>
              <li>Use semicolons (;) to separate multiple values</li>
              <li>Date format: YYYY-MM-DD HH:MM</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-white/20 hover:bg-white/10"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-fuchsia-500/50 transition-colors">
              {file ? (
                <div>
                  <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 border-white/20 hover:bg-white/10"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white font-medium mb-1">Click to upload CSV file</p>
                  <p className="text-gray-400 text-sm">or drag and drop</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 border-white/20 hover:bg-white/10"
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Preview ({preview.posts.length} posts)</h3>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2">Errors ({preview.errors.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.errors.slice(0, 10).map((error, idx) => (
                      <p key={idx} className="text-red-300 text-sm">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                    {preview.errors.length > 10 && (
                      <p className="text-red-300 text-sm">
                        ... and {preview.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Posts Preview */}
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400">Platforms</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-400">Scheduled</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-400">Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.posts.slice(0, 10).map((post, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="px-4 py-2 text-sm text-white">
                            {post.platforms.join(', ')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : 'Draft'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300 truncate max-w-xs">
                            {post.content.linkedin || post.content.twitter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.posts.length > 10 && (
                    <div className="p-3 text-center text-gray-400 text-sm bg-white/5">
                      ... and {preview.posts.length - 10} more posts
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || preview.posts.length === 0 || importing}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 disabled:opacity-50"
          >
            {importing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              <>
                Import {preview?.posts.length || 0} Posts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
