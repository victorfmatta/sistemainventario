import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';
import { api } from "@/lib/api"; 
import { useAuth } from "@/contexts/auth.context";

interface CreateUserFormProps {
  creatorRole: 'DIRETOR' | 'COORDENADOR';
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}

export const CreateUserForm = ({ creatorRole, onSuccess, onCancel }: CreateUserFormProps) => {
  const { user } = useAuth(); // Pegamos o usuário logado para ver as empresas dele
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [role, setRole] = useState<string | undefined>(
    creatorRole === 'COORDENADOR' ? 'INSTRUTOR' : undefined
  );

  // Novo estado para a empresa selecionada
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tenta selecionar automaticamente a primeira empresa da lista
  useEffect(() => {
    if (user?.companies && user.companies.length > 0) {
      setSelectedCompanyId(user.companies[0].id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name || !email || !password || !role) {
      setError('Todos os campos são obrigatórios.');
      setIsLoading(false);
      return;
    }

    if (!selectedCompanyId) {
      setError('Por favor, selecione a empresa para este usuário.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api('/users', {
        method: 'POST',
        // Aqui está o segredo: enviamos o companyId junto com os dados
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role,
          companyId: selectedCompanyId 
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao criar o usuário.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SELEÇÃO DE EMPRESA */}
      <div className="space-y-2">
        <Label htmlFor="company">Empresa do Usuário</Label>
        <Select 
            value={selectedCompanyId} 
            onValueChange={setSelectedCompanyId} 
            disabled={isLoading || !user?.companies?.length}
        >
          <SelectTrigger id="company">
            <SelectValue placeholder="Selecione a empresa..." />
          </SelectTrigger>
          <SelectContent>
            {user?.companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                    {company.name}
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao.silva@email.com" disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha Provisória</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Cargo</Label>
        <Select value={role} onValueChange={setRole} disabled={isLoading || creatorRole === 'COORDENADOR'}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione um cargo..." />
          </SelectTrigger>
          <SelectContent>
            {creatorRole === 'DIRETOR' && (
              <>
                <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                <SelectItem value="INSTRUTOR">Instrutor</SelectItem>
              </>
            )}
            {creatorRole === 'COORDENADOR' && (
              <SelectItem value="INSTRUTOR">Instrutor</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Criar Usuário
        </Button>
      </div>
    </form>
  );
};