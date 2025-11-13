import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

// Tipos para os dados que o formulário vai manipular
interface Unit {
  id: string;
  name: string;
  coordinatorId: string | null;
}

interface Coordinator {
  id: string;
  name: string;
}

interface EditUnitFormProps {
  unit?: Unit | null; // Opcional: se for edição, recebe a unidade
  coordinators: Coordinator[]; // Lista de coordenadores disponíveis
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}

export const EditUnitForm = ({ unit, coordinators, onSuccess, onCancel, token }: EditUnitFormProps) => {
  // Define o estado inicial com base se é uma criação ou edição
  const [name, setName] = useState(unit?.name || '');
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | undefined>(unit?.coordinatorId || undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!unit; // Flag para saber se estamos editando

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name) {
      setError('O nome da unidade é obrigatório.');
      setIsLoading(false);
      return;
    }

    // Define a URL e o método com base se é criação (POST) ou edição (PUT)
    const url = isEditing ? `http://localhost:3001/api/units/${unit.id}` : 'http://localhost:3001/api/units';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          // Envia 'null' se "Nenhum" for selecionado, para desassociar o coordenador
          coordinatorId: selectedCoordinatorId === 'none' ? null : selectedCoordinatorId,
        } ),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} a unidade.`);
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
        <Label htmlFor="name">Nome da Unidade</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Unidade Sul" disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coordinator">Coordenador Responsável</Label>
        <Select value={selectedCoordinatorId || 'none'} onValueChange={setSelectedCoordinatorId} disabled={isLoading}>
          <SelectTrigger id="coordinator">
            <SelectValue placeholder="Selecione um coordenador..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {coordinators.map((coordinator) => (
              <SelectItem key={coordinator.id} value={coordinator.id}>
                {coordinator.name}
              </SelectItem>
            ))}
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
          {isEditing ? 'Salvar Alterações' : 'Criar Unidade'}
        </Button>
      </div>
    </form>
  );
};
