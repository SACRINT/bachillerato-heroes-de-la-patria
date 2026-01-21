'use client';

import { useCallback, useState } from 'react';
import { Upload, X, File, Image, CheckCircle } from 'lucide-react';

interface FileUploadProps {
    accept?: string;
    maxSize?: number; // in MB
    multiple?: boolean;
    onUpload: (files: File[]) => Promise<void>;
    label?: string;
}

export default function FileUpload({
    accept = '*',
    maxSize = 5,
    multiple = false,
    onUpload,
    label = 'Subir archivos',
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const validateFile = (file: File): boolean => {
        if (file.size > maxSize * 1024 * 1024) {
            setError(`El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`);
            return false;
        }
        return true;
    };

    const handleFiles = (fileList: FileList) => {
        const newFiles = Array.from(fileList).filter(validateFile);
        setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
        setError(null);
        setSuccess(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            await onUpload(files);
            setSuccess(true);
            setTimeout(() => {
                setFiles([]);
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al subir archivos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
                <p className="mt-1 text-xs text-gray-500">
                    Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-gray-400">Tamaño máximo: {maxSize}MB</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                        >
                            <div className="flex items-center gap-3">
                                {file.type.startsWith('image/') ? (
                                    <Image className="h-5 w-5 text-blue-600" />
                                ) : (
                                    <File className="h-5 w-5 text-gray-600" />
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            {files.length > 0 && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {uploading ? 'Subiendo...' : `Subir ${files.length} archivo(s)`}
                </button>
            )}

            {/* Status Messages */}
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle className="h-5 w-5" />
                    Archivos subidos exitosamente
                </div>
            )}
        </div>
    );
}
