import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, ImagePlus, X, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useCreatePrompt, useListCategories, getListPromptsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";

const schema = z.object({
  title: z.string().optional(),
  text: z.string().min(10, "Prompt must be at least 10 characters"),
  imageUrl: z.string().optional(),
  categoryId: z.coerce.number().min(1, "Select a category"),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type UploadState = "idle" | "uploading" | "done" | "error";

function ImageUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const [state, setState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | undefined>(value);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    setState("uploading");
    setProgress(0);

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      const serveUrl = `/api/storage${objectPath}`;
      onChange(serveUrl);
      setState("done");
    } catch {
      setState("error");
      setPreview(undefined);
      onChange(undefined);
      setTimeout(() => setState("idle"), 3000);
    }
  }, [onChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const clear = () => {
    setPreview(undefined);
    onChange(undefined);
    setState("idle");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-card-border bg-card"}
          ${state === "error" ? "border-red-400 bg-red-50" : ""}
          ${preview ? "border-primary/40" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-xl"
              />
              {state === "uploading" && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-white text-xs font-medium">{progress}%</span>
                </div>
              )}
              {state === "done" && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {state !== "uploading" && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => inputRef.current?.click()}
              className="w-full py-10 flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                ${state === "error" ? "bg-red-100" : "bg-primary/10 group-hover:bg-primary/20"}`}>
                <ImagePlus className={`w-6 h-6 ${state === "error" ? "text-red-500" : "text-primary"}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${state === "error" ? "text-red-600" : "text-foreground"}`}>
                  {state === "error" ? "Upload failed — try again" : "Drop image here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          data-testid="input-image-upload"
        />
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createPrompt = useCreatePrompt();
  const { data: categories } = useListCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", text: "", imageUrl: "", tags: "" },
  });

  const imageUrl = form.watch("imageUrl");

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Sign in to submit</h2>
          <p className="text-muted-foreground mb-6">Share your prompts with the community.</p>
          <Link href="/sign-in">
            <span className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer transition-colors">
              Sign in
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = (values: FormValues) => {
    const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    createPrompt.mutate(
      {
        data: {
          title: values.title || undefined,
          text: values.text,
          imageUrl: values.imageUrl || undefined,
          categoryId: values.categoryId,
          tags,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          toast({ title: "Prompt submitted!", description: "Your prompt is now live." });
          setLocation("/");
        },
        onError: () => toast({ title: "Error", description: "Failed to submit prompt", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black">Submit a Prompt</h1>
          </div>
          <p className="text-muted-foreground mb-8">Share your best prompts with the community.</p>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <Input data-testid="input-title" placeholder="Ethereal Forest Goddess" {...field} className="bg-card border-card-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="text" render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt Text</FormLabel>
                <FormControl>
                  <textarea
                    data-testid="input-text"
                    {...field}
                    rows={4}
                    placeholder="Describe what you want to generate..."
                    className="w-full px-4 py-3 rounded-xl bg-card border border-card-border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select
                    data-testid="select-category"
                    {...field}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon_emoji} {cat.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Photo Result{" "}
                    <span className="text-muted-foreground text-xs">(optional — show what this prompt creates)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <ImageUploader
                        value={field.value}
                        onChange={(url) => field.onChange(url ?? "")}
                      />
                      {!imageUrl && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">or paste URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      {!imageUrl && (
                        <Input
                          placeholder="https://..."
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="bg-card border-card-border text-sm"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem>
                <FormLabel>Tags <span className="text-muted-foreground text-xs">(comma separated, optional)</span></FormLabel>
                <FormControl>
                  <Input data-testid="input-tags" placeholder="portrait, fantasy, nature" {...field} className="bg-card border-card-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <button
              type="submit"
              data-testid="button-submit"
              disabled={createPrompt.isPending}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createPrompt.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Prompt"
              )}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
