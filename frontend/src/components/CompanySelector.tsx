import { useAuth } from "@/contexts/auth.context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function CompanySelector() {
  const { user, selectedCompanyId, selectCompany } = useAuth();

  // Se o usuário não tiver empresas carregadas ou for undefined, não mostra nada
  if (!user?.companies || user.companies.length <= 1) {
    return null; // Coordenadores/Instrutores geralmente só têm 1, então não precisam trocar
  }

  const handleValueChange = (value: string) => {
    selectCompany(value);
    // Recarrega a página para garantir que todos os dados (estoque, fornecedores) 
    // sejam buscados do zero com o novo ID da empresa.
    window.location.reload(); 
  };

  // Encontra o nome da empresa atual para exibir
  const currentCompany = user.companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="w-full px-2 mb-4">
      <label className="text-xs text-white/50 mb-1.5 block px-1 uppercase tracking-wider font-semibold">
        Empresa Ativa
      </label>
      <Select value={selectedCompanyId || ''} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full bg-white/10 border-white/10 text-white h-10 hover:bg-white/15 transition-colors focus:ring-brand-blue/50">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 bg-brand-blue rounded-md">
                <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="truncate font-medium">
                {currentCompany ? currentCompany.name : "Selecione..."}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#0f172a] border-white/10 text-white min-w-[200px]">
          {user.companies.map((company) => (
            <SelectItem 
                key={company.id} 
                value={company.id}
                className="focus:bg-brand-blue/20 focus:text-white cursor-pointer py-3"
            >
              <span className="font-medium">{company.name}</span>
              {company.cnpj && (
                  <span className="block text-xs text-white/40 mt-0.5">{company.cnpj}</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}