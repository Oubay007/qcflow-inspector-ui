import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — QC Flow Quality Control" },
      { name: "description", content: "Sign in to QC Flow to run shop-floor quality inspections, track non-conformities and monitor machine performance." },
      { property: "og:title", content: "Sign in — QC Flow" },
      { property: "og:description", content: "Factory quality control automation for injection-moulding plants." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ahmed.bennani@qcflow.io");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/" });
  }, [ready, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardCheck className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">QC Flow</span>
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access the quality control workspace for your production lines.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={async () => {
                await authService.requestPasswordReset(email);
                toast.success("Reset link sent to " + email);
              }}
            >
              Forgot your password?
            </button>
          </form>

          <p className="mt-8 rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted-foreground">
            Demo mode — any password works. Try <span className="font-medium text-foreground">salma.idrissi@qcflow.io</span>{" "}
            for the admin view.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative flex h-full flex-col justify-end gap-4 p-12 text-primary-foreground">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Every two hours,
            <br />
            every machine, verified.
          </p>
          <p className="max-w-md text-sm text-primary-foreground/80">
            QC Flow replaces paper inspection sheets with guided digital controls, automatic tolerance evaluation and
            live conformity analytics across the whole plant.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-primary-foreground/20 pt-6">
            {[
              ["98.4%", "Conformity"],
              ["5", "Slots / shift"],
              ["<2min", "Per inspection"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="text-xl font-semibold">{v}</p>
                <p className="text-xs text-primary-foreground/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
