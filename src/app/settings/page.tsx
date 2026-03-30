"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Upload } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    gstNo: "",
    panNo: "",
    address: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    micrCode: "",
    branchCode: "",
    bankAddress: "",
    terms: [] as string[],
    signatoryName: "",
    signatureUrl: "",
    footerAddress: "",
    website: "",
    phone: "",
  });

  const [termsText, setTermsText] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            companyName: data.companyName || "",
            tagline: data.tagline || "",
            gstNo: data.gstNo || "",
            panNo: data.panNo || "",
            address: data.address || "",
            bankName: data.bankName || "",
            accountName: data.accountName || "",
            accountNumber: data.accountNumber || "",
            ifscCode: data.ifscCode || "",
            micrCode: data.micrCode || "",
            branchCode: data.branchCode || "",
            bankAddress: data.bankAddress || "",
            terms: data.terms || [],
            signatoryName: data.signatoryName || "",
            signatureUrl: data.signatureUrl || "",
            footerAddress: data.footerAddress || "",
            website: data.website || "",
            phone: data.phone || "",
          });
          setTermsText((data.terms || []).join("\n"));
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTermsText(e.target.value);
    setFormData((prev) => ({
      ...prev,
      terms: e.target.value.split("\n").filter((t) => t.trim() !== "")
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({ ...prev, signatureUrl: result.url }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Settings saved successfully");
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your company details, invoice settings, and bank information.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        {/* Header / Basic Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Basic Info & Header</h2>
          
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" value={formData.tagline} onChange={handleChange} />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="footerAddress">Company Address (Footer)</Label>
            <Textarea id="footerAddress" name="footerAddress" value={formData.footerAddress} onChange={handleChange} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" value={formData.website} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Legal & Issued By */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Tax Details (Issued By)</h2>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Issued By Address</Label>
            <Textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={2} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gstNo">GST No.</Label>
              <Input id="gstNo" name="gstNo" value={formData.gstNo} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="panNo">PAN No.</Label>
              <Input id="panNo" name="panNo" value={formData.panNo} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Bank Details */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Bank Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input id="accountName" name="accountName" value={formData.accountName} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input id="ifscCode" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="micrCode">MICR Code</Label>
              <Input id="micrCode" name="micrCode" value={formData.micrCode} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branchCode">Branch Code</Label>
              <Input id="branchCode" name="branchCode" value={formData.branchCode} onChange={handleChange} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankAddress">Bank Branch Address</Label>
            <Textarea id="bankAddress" name="bankAddress" value={formData.bankAddress} onChange={handleChange} rows={2} />
          </div>
        </section>

        {/* Terms & Signatory */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Terms & Signature</h2>
          
          <div className="grid gap-2">
            <Label htmlFor="terms">Terms & Conditions (One per line)</Label>
            <Textarea 
              id="terms" 
              name="terms" 
              value={termsText} 
              onChange={handleTermsChange} 
              rows={5} 
            />
          </div>

          <div className="grid gap-2 mt-4">
            <Label htmlFor="signatoryName">Authorized Signatory Name</Label>
            <Input id="signatoryName" name="signatoryName" value={formData.signatoryName} onChange={handleChange} />
          </div>

          <div className="grid gap-2">
            <Label>Signature Image</Label>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" className="w-fit" disabled={uploading}>
                <label className="cursor-pointer flex items-center gap-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Signature
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </Button>
              {formData.signatureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.signatureUrl} alt="Signature Preview" className="h-10 object-contain border bg-white p-1 rounded" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
