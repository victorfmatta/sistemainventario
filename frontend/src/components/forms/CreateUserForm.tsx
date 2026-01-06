import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

// --- INÍCIO DAS ALTERAÇÕES ---
// 1. Adicionar 'creatorRole' às props
interface CreateUserFormProps {
  creatorRole: 'DIRETOR' | 'COORDENADOR'; // Informa quem está criando o usuário
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}
// --- FIM DAS ALTERAÇÕES ---

export const CreateUserForm = ({ creatorRole, onSuccess, onCancel, token }: CreateUserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- INÍCIO DAS ALTERAÇÕES ---
  // 2. Definir o estado inicial do cargo com base no criador
  const [role, setRole] = useState<string | undefined>(
    creatorRole === 'COORDENADOR' ? 'INSTRUTOR' : undefined
  );
  // --- FIM DAS ALTERAÇÕES ---
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name || !email || !password || !role) {
      setError('Todos os campos são obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role } ),
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
        {/* --- INÍCIO DAS ALTERAÇÕES --- */}
        {/* 3. Desabilitar o seletor se o criador for um Coordenador */}
        <Select value={role} onValueChange={setRole} disabled={isLoading || creatorRole === 'COORDENADOR'}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione um cargo..." />
          </SelectTrigger>
          <SelectContent>
            {/* 4. Mostrar opções diferentes com base no criador */}
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
        {/* --- FIM DAS ALTERAÇÕES --- */}
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
