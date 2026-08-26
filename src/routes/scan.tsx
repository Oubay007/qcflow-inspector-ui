import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, QrCode, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { machineService } from "@/services/api/machineService";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan machine — QC Flow" },
      {
        name: "description",
        content: "Scan a machine QR code or type its code to jump straight into the current two-hour quality inspection.",
      },
      { property: "og:title", content: "Scan machine — QC Flow" },
      { property: "og:description", content: "Open the right inspection instantly from the shop floor." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const machines = useQuery({ queryKey: ["machines"], queryFn: () => machineService.list() });

  async function resolve(value: string) {
    setLoading(true);
    const machine = await machineService.getByCode(value);
    setLoading(false);
    if (!machine) {
      toast.error(`No machine found for “${value}”`);
      return;
    }
    toast.success(`${machine.name} identified`);
    void navigate({ to: "/inspection", search: { machineId: machine.id } });
  }

  return (
    <AppShell>
      <PageHeader title="Scan machine" description="Point the tablet camera at the machine QR tag, or enter the code manually." />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-primary/40 bg-primary-soft/40">
            <div className="absolute inset-x-8 h-0.5 animate-pulse bg-primary/60" />
            <div className="text-center">
              <QrCode className="mx-auto size-14 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">Camera preview</p>
              <p className="mt-1 text-xs text-muted-foreground">Demo mode — use the manual entry to continue.</p>
            </div>
          </div>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void resolve(code);
            }}
          >
            <Label htmlFor="code">Machine code</Label>
            <div className="flex gap-2">
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PR-04" />
              <Button type="submit" disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />} Open
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="text-sm font-semibold text-foreground">Nearby machines</p>
          <p className="text-xs text-muted-foreground">Tap a machine to start its inspection.</p>
          <div className="mt-4 space-y-2">
            {(machines.data ?? []).map((m) => (
              <button
                key={m.id}
                onClick={() => void resolve(m.code)}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
              >
                <span>
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">{m.code} · {m.location}</span>
                </span>
                <span className="text-xs capitalize text-muted-foreground">{m.status}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
