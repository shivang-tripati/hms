"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, UploadCloud, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoUploadProps {
    label: string;
    value?: any;
    onChange: (val: any) => void;
    error?: string;
}

export function PhotoUpload({ label, value, onChange, error }: PhotoUploadProps) {
    const [preview, setPreview] = useState<string | null>(typeof value === 'string' ? value : value?.url || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Failed to upload file");
                }

                let location: { latitude: number; longitude: number } | null = null;
                try {
                    const { getCurrentLocation } = await import("@/lib/geolocation");
                    location = await getCurrentLocation();
                } catch (err) {
                    console.warn("Location capture failed:", err);
                }

                const data = await response.json();
                setPreview(data.url);
                onChange({
                    url: data.url,
                    latitude: location?.latitude,
                    longitude: location?.longitude
                });
            } catch (err) {
                console.error("Upload error:", err);
                toast.error("Failed to upload photo.");
            } finally {
                setIsUploading(false);
            }
        }
    };
    const removePhoto = () => {
        setPreview(null);
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div
                className={cn(
                    "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200",
                    preview ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                    error && "border-red-500 bg-red-50"
                )}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3"
                                onClick={removePhoto}
                            >
                                <X className="h-4 w-4 mr-1" /> Remove
                            </Button>
                        </div>
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </>
                ) : (
                    <div
                        className="flex flex-col items-center gap-2 cursor-pointer p-4 w-full h-full justify-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-semibold text-slate-900">Click to upload</p>
                            <p className="text-[10px] text-slate-500">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}
