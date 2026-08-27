import { useState, useRef } from "react"
import { useNavigate } from "react-router"
import { useUploadThing } from "@/uploadthing"
import {
  uploadAndSignDocument,
  type DocumentType,
  type SignedDocument,
} from "../api/documents"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  FileUploadIcon,
  Files02Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  PrinterIcon,
  Download02Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

const documentTypes: DocumentType[] = [
  "Certificate",
  "Transcript",
  "Letter",
  "Diploma",
  "Other",
]

const UploadDocuments = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [type, setType] = useState<DocumentType>("Other")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Custom signing flow steps
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState<
    "idle" | "uploading" | "signing" | "complete"
  >("idle")
  const [completedDoc, setCompletedDoc] = useState<SignedDocument | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

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
      toast.loading("Signing document with organization private key...", {
        id: toastId,
      })

      const signedDoc = await uploadAndSignDocument({
        title: title.trim(),
        type,
        fileUrl: uploadedFile.url,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      setCompletedDoc(signedDoc)
      setProcessStep("complete")
      toast.success("Document issued and digitally signed successfully!", {
        id: toastId,
      })

      // Reset form fields
      setTitle("")
      setFile(null)
      setType("Other")
    } catch (err: unknown) {
      console.error(err)
      setIsProcessing(false)
      setProcessStep("idle")

      const error = err as {
        response?: { data?: { error?: string } }
        message?: string
      }
      const errMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to process document"
      toast.error(errMsg, { id: toastId })
    }
  }

  const handlePrintPdf = async (url: string) => {
    setIsPrinting(true)
    const toastId = toast.loading("Preparing document for print...")
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.src = blobUrl
      document.body.appendChild(iframe)

      iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        toast.success("Print dialog opened.", { id: toastId })
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(blobUrl)
          setIsPrinting(false)
        }, 1000)
      }
    } catch (error) {
      console.error("Direct printing failed, opening in new tab", error)
      toast.info("Opening document in new tab for printing...", { id: toastId })
      window.open(url, "_blank")
      setIsPrinting(false)
    }
  }

  const handleReset = () => {
    setCompletedDoc(null)
    setProcessStep("idle")
    setIsProcessing(false)
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Sign & Issue Document
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Upload, digitally sign, and issue certificates, transcripts,
            letters, and other verified academic credentials.
          </p>
        </div>

        {completedDoc && processStep === "complete" ? (
          <Card className="mx-auto w-full max-w-2xl animate-in border-border bg-card py-0 shadow-lg duration-300 fade-in">
            <CardHeader className="flex flex-col items-center gap-3 border-b border-emerald-500/20 bg-emerald-500/10 py-6 text-center">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-16 animate-bounce text-emerald-500"
                strokeWidth={2}
              />
              <div>
                <CardTitle className="text-xl font-bold text-emerald-500">
                  Credential Successfully Issued!
                </CardTitle>
                <CardDescription className="mt-1 text-emerald-500/80">
                  The document has been modified with an embedded verification
                  QR code, hashed, and cryptographically signed.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="border-b border-border pb-4">
                  <div className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Credential Details
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {completedDoc.title}
                  </h3>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground select-all">
                    ID: {completedDoc.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground">
                      Credential Type
                    </span>
                    <span className="mt-1 inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-semibold text-foreground">
                      {completedDoc.type}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground">
                      File Details
                    </span>
                    <span
                      className="mt-1 block max-w-xs truncate font-medium text-foreground"
                      title={completedDoc.originalFilename}
                    >
                      {completedDoc.originalFilename} (
                      {formatBytes(completedDoc.fileSize)})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-muted-foreground">
                      Verification Link URL
                    </span>
                    <span className="mt-1 block font-mono text-xs break-all text-primary select-all hover:underline">
                      {`${window.location.origin}/verification?token=${completedDoc.verificationToken}`}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-muted-foreground">
                      SHA-256 Ledger Hash
                    </span>
                    <span className="mt-1 block rounded-md border border-border bg-muted p-2 font-mono text-xs break-all text-foreground select-all">
                      {completedDoc.documentHash}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between gap-3 border-t border-border bg-muted/40 p-6 sm:flex-row">
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  onClick={() => handlePrintPdf(completedDoc.fileUrl)}
                  disabled={isPrinting}
                  variant="outline"
                  className="flex flex-1 items-center justify-center gap-2 font-medium sm:flex-none"
                >
                  {isPrinting ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={PrinterIcon} className="size-4" />
                  )}
                  Print PDF
                </Button>
                <Button
                  asChild
                  className="flex flex-1 items-center justify-center gap-2 font-semibold sm:flex-none"
                >
                  <a
                    href={completedDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={Download02Icon} className="size-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="flex-1 sm:w-auto"
                >
                  Issue Another
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/dashboard/documents")}
                  className="flex-1 sm:w-auto"
                >
                  View List
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="relative overflow-hidden border-border bg-card shadow-md">
            {/* Custom Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-50 flex animate-in flex-col items-center justify-center bg-background/80 p-6 text-center backdrop-blur-sm duration-300 fade-in">
                <div className="flex max-w-md flex-col items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    {processStep !== "complete" ? (
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="size-12 animate-spin text-primary"
                        strokeWidth={2}
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        className="size-12 animate-bounce text-emerald-500"
                        strokeWidth={2}
                      />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground">
                    {processStep === "uploading" && "Uploading Document"}
                    {processStep === "signing" && "Generating RSA Signature"}
                    {processStep === "complete" && "Completed successfully!"}
                  </h3>

                  <div className="w-full space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${processStep === "uploading" ? "animate-pulse bg-primary" : processStep !== "idle" ? "bg-emerald-500" : "bg-muted"}`}
                      />
                      <span
                        className={
                          processStep === "uploading"
                            ? "font-medium text-foreground"
                            : ""
                        }
                      >
                        Uploading PDF to UploadThing storage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${processStep === "signing" ? "animate-pulse bg-primary" : processStep === "complete" ? "bg-emerald-500" : "bg-muted"}`}
                      />
                      <span
                        className={
                          processStep === "signing"
                            ? "font-medium text-foreground"
                            : ""
                        }
                      >
                        Computing SHA-256 and signing hash
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${processStep === "complete" ? "bg-emerald-500" : "bg-muted"}`}
                      />
                      <span
                        className={
                          processStep === "complete"
                            ? "font-medium text-foreground"
                            : ""
                        }
                      >
                        Issuing credentials and generating token
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Fill in the credential details below and upload the PDF file to
                sign it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                noValidate
                onSubmit={handleSubmit}
                className="space-y-6"
              >
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
                    disabled={isProcessing}
                    className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/5 hover:border-muted-foreground hover:bg-muted/10"
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
                      <HugeiconsIcon
                        icon={FileUploadIcon}
                        className="mb-3 size-10 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <p className="text-sm font-medium text-foreground">
                        Drag & drop your PDF file here, or click to browse
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Max file size: 128MB. Supporting PDF format credentials.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <HugeiconsIcon
                          icon={Files02Icon}
                          className="size-8 shrink-0 text-primary"
                          strokeWidth={1.5}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
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
                        aria-label="Remove selected file"
                        onClick={handleRemoveFile}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={isProcessing}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full font-medium"
                    disabled={isProcessing}
                  >
                    Sign & Issue Document
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default UploadDocuments
