import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditUserFormProps {
  user: User; // O formulário sempre recebe o usuário a ser editado
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}

export const EditUserForm = ({ user, onSuccess, onCancel, token }: EditUserFormProps) => {
  // Estados para os campos do formulário, inicializados com os dados do usuário
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para resetar os campos se o usuário a ser editado mudar
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!name || !email || !role) {
      setError('Todos os campos são obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          role,
        } ),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao atualizar o usuário.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Cargo</Label>
        <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione um cargo..." />
          </SelectTrigger>
          <SelectContent>
            {/* O Diretor pode alterar para Coordenador ou Instrutor */}
            <SelectItem value="COORDENADOR">Coordenador</SelectItem>
            <SelectItem value="INSTRUTOR">Instrutor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};
