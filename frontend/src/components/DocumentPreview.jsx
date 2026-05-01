const BACKEND = 'http://localhost:5001';

function fileIcon(mime) {
  if (!mime) return '📄';
  if (mime === 'application/pdf') return '📕';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('word')) return '📝';
  if (mime.includes('excel') || mime.includes('spreadsheet') || mime === 'text/csv') return '📊';
  return '📄';
}

export default function DocumentPreview({ fileUrl, fileName, fileSize, fileMimeType }) {
  if (!fileUrl) return null;

  const fullUrl = `${BACKEND}${fileUrl}`;
  const isImage = fileMimeType?.startsWith('image/');
  const isPdf = fileMimeType === 'application/pdf';
  const sizeKb = fileSize ? (fileSize / 1024).toFixed(1) : null;

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-slate-200 text-sm">Attached Document</h3>

      {/* Image preview */}
      {isImage && (
        <img
          src={fullUrl}
          alt={fileName}
          className="rounded-lg max-h-64 object-contain bg-slate-800 w-full"
        />
      )}

      {/* PDF inline preview */}
      {isPdf && (
        <iframe
          src={fullUrl}
          title={fileName}
          className="w-full rounded-lg bg-slate-800"
          style={{ height: '400px' }}
        />
      )}

      {/* File info row */}
      <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{fileIcon(fileMimeType)}</span>
          <div className="min-w-0">
            <p className="text-sm text-slate-300 truncate">{fileName}</p>
            {sizeKb && <p className="text-xs text-slate-500">{sizeKb} KB</p>}
          </div>
        </div>
        <a
          href={fullUrl}
          download={fileName}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs py-1 px-3 shrink-0 ml-3"
        >
          Download
        </a>
      </div>
    </div>
  );
}
