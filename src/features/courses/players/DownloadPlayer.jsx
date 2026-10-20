import React from 'react';
import { Download, File, FolderArchive, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const DownloadPlayer = ({ content = {} }) => {
  const mediaObj = typeof content === 'string' ? { files: [{ name: content, size: 'Resource' }] } : (content || {});
  const files = (Array.isArray(mediaObj.files) && mediaObj.files.length > 0)
    ? mediaObj.files
    : [
        {
          name: mediaObj.name || mediaObj.title || mediaObj.fileName || 'course-resource-file.pdf',
          size: mediaObj.size || 'Downloadable Resource File',
          url: mediaObj.fileUrl || mediaObj.url || '#'
        }
      ];

  const getFileIcon = (fileName) => {
    if (!fileName) return File;
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) return FolderArchive;
    if (fileName.endsWith('.xls') || fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) return FileSpreadsheet;
    return File;
  };

  const handleDownload = (file) => {
    const fileUrl = file.url || file.fileUrl || mediaObj.fileUrl;
    if (fileUrl && fileUrl !== '#') {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.name || 'downloaded-resource';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Resource File Content: ${file.name}`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'resource.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="border-border bg-white select-none font-sans">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Attachable Course Resources</h3>
        <p className="text-xs text-slate-600 leading-normal">Download instructions, sheets, or code files associated with this module.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {files.map((file, idx) => {
            const fileName = file.name || file.title || `Resource ${idx + 1}`;
            const Icon = getFileIcon(fileName);
            return (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#2563EB] shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#202124] truncate leading-snug">{fileName}</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{file.size || 'Attached File'}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="p-2 h-8 w-8 text-slate-600 hover:text-[#2563EB] border-slate-200 bg-white"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DownloadPlayer;
