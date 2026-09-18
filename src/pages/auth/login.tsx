import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletIcon } from "@phosphor-icons/react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      toast.error("Email atau password salah!");
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
          <CardTitle className="text-xl">Masuk ke Our Wallet</CardTitle>
          <CardDescription>Catat keuangan keluarga dalam satu tempat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary font-medium">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
