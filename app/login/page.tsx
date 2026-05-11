"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Credenciales incorrectas");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: "linear-gradient(160deg, #f5d9d6 0%, #d4e1e2 50%, #bfd8d2 100%)" }}>
      <div className="w-full max-w-sm">

        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-full items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "#49517e" }}>Ignea Wellness</h1>
          <p className="text-sm mt-1" style={{ color: "#84719b" }}>Studio · Puerto Vallarta</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)" }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: "#49517e" }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="studio.ignea@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 bg-white/70"
                style={{ borderBottom: "2px solid #bfd8d2" }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "#49517e" }}>Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 bg-white/70"
                style={{ borderBottom: "2px solid #bfd8d2" }}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2 text-white border-0"
              style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
