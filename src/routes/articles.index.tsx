import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ruler, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge, resultTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { articleService } from "@/services/api/articleService";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles & tolerances — QC Flow" },
      {
        name: "description",
        content: "Every produced article with its own quality checklist and dimensional tolerances, editable per reference.",
      },
      { property: "og:title", content: "Articles & tolerances — QC Flow" },
      { property: "og:description", content: "Define per-article checks, measurements and min/max tolerances." },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  const articles = useQuery({ queryKey: ["articles"], queryFn: () => articleService.list() });

  const create = useMutation({
    mutationFn: () => articleService.create(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article created");
      setOpen(false);
      setForm({ code: "", name: "", description: "" });
    },
  });

  const rows = useMemo(
    () =>
      (articles.data ?? []).filter((a) =>
        search ? `${a.code} ${a.name} ${a.description}`.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [articles.data, search],
  );

  return (
    <AppShell>
      <PageHeader
        title="Articles & tolerances"
        description="Each reference carries its own inspection checklist and dimensional specification."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4" /> New article</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New article</DialogTitle>
                <DialogDescription>Create the reference, then add its checks and tolerances.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ART-2451" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bouchon PE 28mm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={!form.code || !form.name || create.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search articles" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        {rows.map((a) => (
          <Link
            key={a.id}
            to="/articles/$articleId"
            params={{ articleId: a.id }}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold tracking-tight text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.code}</p>
              </div>
              <StatusBadge tone={resultTone(a.status)}>{a.status}</StatusBadge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="size-3.5" /> {a.checks.length} checks</span>
              <span className="inline-flex items-center gap-1.5"><Ruler className="size-3.5" /> {a.measurements.length} measurements</span>
            </div>
          </Link>
        ))}
        {!articles.isLoading && rows.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">No articles found.</p>
        )}
      </div>
    </AppShell>
  );
}
