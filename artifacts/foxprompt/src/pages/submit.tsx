import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";
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
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.coerce.number().min(1, "Select a category"),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="imageUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <Input data-testid="input-image-url" placeholder="https://..." {...field} className="bg-card border-card-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

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
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {createPrompt.isPending ? "Submitting..." : "Submit Prompt"}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
