import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletIcon } from "@phosphor-icons/react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password minimal 8 karakter!");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      toast.success("Akun berhasil dibuat!");
      navigate("/onboarding/household", { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Gagal mendaftar. Coba lagi.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-sm">
        <CardHeader className="items-center text-center space-y-2">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <WalletIcon className="size-6" />
          </div>
          <CardTitle className="text-xl">Buat Akun Baru</CardTitle>
          <CardDescription>Mulai catat keuangan keluarga Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Daftar"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
