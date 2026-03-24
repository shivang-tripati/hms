"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, UploadCloud, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MultiPhotoUploadProps {
    label: string;
    value?: string[];
    onChange: (urls: string[]) => void;
    error?: string;
    maxFiles?: number;
}

export function MultiPhotoUpload({ label, value = [], onChange, error, maxFiles = 5 }: MultiPhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remainingSlots = maxFiles - value.length;
        const filesToProcess = files.slice(0, remainingSlots);

        setIsUploading(true);
        const promises = filesToProcess.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Upload failed");
            }
            const data = await response.json();
            return data.url;
        });

        Promise.all(promises)
            .then((urls) => {
                const newValues = [...value, ...urls];
                onChange(newValues);
            })
            .catch((err: Error) => {
                console.error("Upload error:", err);
                toast.error("Failed to upload one or more photos.");
            })
            .finally(() => {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            });
    };

    const removePhoto = (index: number) => {
        const newValues = [...value];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <span className="text-xs text-muted-foreground">{value.length} / {maxFiles} images</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((photoUrl, idx) => (
                    <div
                        key={idx}
                        className="relative aspect-video rounded-xl border-2 border-indigo-500 overflow-hidden group"
                    >
                        <img
                            src={photoUrl}
                            alt={`Upload preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => removePhoto(idx)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                ))}

                {value.length < maxFiles && (
                    <div
                        className={cn(
                            "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer",
                            error ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-xs font-medium">Processing...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 p-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <UploadCloud className="h-4 w-4" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-900">Add Photo</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                multiple
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}
