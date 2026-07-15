import { useState, useRef } from "react"
import { useNavigate } from "react-router"
import { useUploadThing } from "@/uploadthing"
import { uploadAndSignDocument, type DocumentType } from "../api/documents"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, Files02Icon, Loading03Icon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

const documentTypes: DocumentType[] = ["Certificate", "Transcript", "Letter", "Diploma", "Other"]

const UploadDocuments = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [title, setTitle] = useState("")
  const [type, setType] = useState<DocumentType>("Other")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  // Custom signing flow steps
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState<"idle" | "uploading" | "signing" | "complete">("idle")

  const { startUpload } = useUploadThing("pdfUploader")

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type !== "application/pdf") {
        toast.error("Invalid file format. Only PDF files are supported.")
        return
      }
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        toast.error("Invalid file format. Only PDF files are supported.")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a document title.")
      return
    }

    if (!file) {
      toast.error("Please select or drop a PDF file.")
      return
    }

    setIsProcessing(true)
    setProcessStep("uploading")
    const toastId = toast.loading("Starting document processing...")

    try {
      // 1. Upload to UploadThing
      toast.loading("Uploading PDF file to secure storage...", { id: toastId })
      const uploadRes = await startUpload([file])
      const uploadedFile = uploadRes?.[0]
      
      if (!uploadedFile) {
        throw new Error("File upload failed. Please try again.")
      }

      // 2. Hash, sign, and save on backend
      setProcessStep("signing")
      toast.loading("Signing document with organization private key...", { id: toastId })

      await uploadAndSignDocument({
        title: title.trim(),
        type,
        fileUrl: uploadedFile.url,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      setProcessStep("complete")
      toast.success("Document issued and digitally signed successfully!", { id: toastId })
      
      // Reset form
      setTitle("")
      setFile(null)
      setType("Other")
      
      // Redirect to documents view
      setTimeout(() => {
        navigate("/dashboard/documents")
      }, 1000)

    } catch (err: unknown) {
      console.error(err)
      setIsProcessing(false)
      setProcessStep("idle")
      
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errMsg = error.response?.data?.error || error.message || "Failed to process document";
      toast.error(errMsg, { id: toastId })
    }
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Sign & Issue Document
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Upload, digitally sign, and issue certificates, transcripts, letters, and other verified academic credentials.
          </p>
        </div>

        <Card className="border-border bg-card shadow-md relative overflow-hidden">
          {/* Custom Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4 max-w-md">
                <div className="relative flex items-center justify-center">
                  {processStep !== "complete" ? (
                    <HugeiconsIcon icon={Loading03Icon} className="size-12 text-primary animate-spin" strokeWidth={2} />
                  ) : (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-12 text-emerald-500 animate-bounce" strokeWidth={2} />
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-foreground">
                  {processStep === "uploading" && "Uploading Document"}
                  {processStep === "signing" && "Generating RSA Signature"}
                  {processStep === "complete" && "Completed successfully!"}
                </h3>
                
                <div className="space-y-2 w-full text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${processStep === "uploading" ? "bg-primary animate-pulse" : processStep !== "idle" ? "bg-emerald-500" : "bg-muted"}`} />
                    <span className={processStep === "uploading" ? "text-foreground font-medium" : ""}>Uploading PDF to UploadThing storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${processStep === "signing" ? "bg-primary animate-pulse" : processStep === "complete" ? "bg-emerald-500" : "bg-muted"}`} />
                    <span className={processStep === "signing" ? "text-foreground font-medium" : ""}>Computing SHA-256 and signing hash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${processStep === "complete" ? "bg-emerald-500" : "bg-muted"}`} />
                    <span className={processStep === "complete" ? "text-foreground font-medium" : ""}>Issuing credentials and generating token</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Fill in the credential details below and upload the PDF file to sign it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Bachelor of Science Degree Certificate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isProcessing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as DocumentType)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>File Upload (PDF only)</Label>
                
                {!file ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors text-center ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground hover:bg-muted/10 bg-muted/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <HugeiconsIcon icon={FileUploadIcon} className="size-10 text-muted-foreground mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-foreground">
                      Drag & drop your PDF file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max file size: 128MB. Supporting PDF format credentials.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border border-border bg-muted/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <HugeiconsIcon icon={Files02Icon} className="size-8 text-primary shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      disabled={isProcessing}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full font-medium" disabled={isProcessing}>
                  Sign & Issue Document
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default UploadDocuments
