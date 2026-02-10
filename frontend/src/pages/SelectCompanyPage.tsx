import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";

const SelectCompanyPage = () => {
  const { user, selectCompany, selectedCompanyId, logout } = useAuth();
  const navigate = useNavigate();

  // Se o usuário já tiver uma empresa selecionada, manda pro dashboard
  useEffect(() => {
    if (selectedCompanyId) {
      navigate("/dashboard");
    }
  }, [selectedCompanyId, navigate]);

  const handleSelect = (companyId: string) => {
    selectCompany(companyId);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-brand-blue/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-brand-cyan" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Selecione a Empresa</CardTitle>
          <CardDescription className="text-white/60">
            Você tem acesso a múltiplas organizações. Escolha uma para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {user?.companies?.map((company) => (
              <Button
                key={company.id}
                onClick={() => handleSelect(company.id)}
                className="h-auto py-4 px-6 flex items-center justify-between bg-white/5 hover:bg-brand-blue/20 border border-white/10 hover:border-brand-blue/50 transition-all group"
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white group-hover:text-brand-cyan transition-colors">
                    {company.name}
                  </span>
                  {company.cnpj && (
                    <span className="text-xs text-white/40">
                      CNPJ: {company.cnpj}
                    </span>
                  )}
                </div>
                <Building2 className="w-4 h-4 text-white/30 group-hover:text-brand-cyan transition-colors" />
              </Button>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <Button 
              variant="ghost" 
              className="w-full text-white/50 hover:text-white hover:bg-white/5"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectCompanyPage;