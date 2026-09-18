import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import * as householdsService from "@/services/households.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersThreeIcon } from "@phosphor-icons/react";

export default function OnboardingHouseholdPage() {
  const { refetchUser } = useAuth();
  const navigate = useNavigate();

  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await householdsService.createHousehold(householdName);
      await refetchUser();
      toast.success("Household berhasil dibuat!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Gagal membuat household. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await householdsService.acceptInvite(inviteCode);
      await refetchUser();
      toast.success("Berhasil bergabung ke household!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Kode undangan tidak valid atau sudah kedaluwarsa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="items-center text-center space-y-2">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UsersThreeIcon className="size-6" />
          </div>
          <CardTitle className="text-xl">Bergabung ke Household</CardTitle>
          <CardDescription>
            Buat household baru sebagai Admin, atau gabung memakai kode undangan dari pasangan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Buat Baru</TabsTrigger>
              <TabsTrigger value="join">Gabung</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="pt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="household-name">Nama Household</Label>
                  <Input
                    id="household-name"
                    placeholder="Keluarga Bayu & Annisa"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Buat Household (jadi Admin)"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="pt-4">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-code">Kode Undangan</Label>
                  <Input
                    id="invite-code"
                    placeholder="Contoh: a1b2c3d4e5f6"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Gabung (jadi Member)"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
