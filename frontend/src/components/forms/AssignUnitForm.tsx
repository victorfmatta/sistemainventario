import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

// Tipos de dados que o formulário recebe
interface Unit {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  name: string; // Adicionado para exibir no título do modal
  unit: {
    id: string;
    name: string;
  } | null;
}

interface AssignUnitFormProps {
  instructor: Instructor;
  units: Unit[]; // Lista de unidades que o Coordenador gerencia
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}

export const AssignUnitForm = ({ instructor, units, onSuccess, onCancel, token }: AssignUnitFormProps) => {
  // O estado inicial do select é a unidade atual do instrutor, se houver
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(instructor.unit?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!selectedUnitId) {
      setError('Por favor, selecione uma unidade.');
      setIsLoading(false);
      return;
    }

    try {
      // Faz a requisição para a nova rota que criamos no backend
      const response = await fetch(`http://localhost:3001/api/users/${instructor.id}/assign-unit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ unitId: selectedUnitId } ),
      });

      if (response.ok) {
        onSuccess(); // Chama a função de sucesso para fechar o modal e recarregar os dados
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao associar a unidade.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="unit-select">Selecione a Unidade</Label>
        <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={isLoading}>
          <SelectTrigger id="unit-select">
            <SelectValue placeholder="Selecione uma unidade..." />
          </SelectTrigger>
          <SelectContent>
            {units.length > 0 ? (
              units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-sm text-muted-foreground">Nenhuma unidade gerenciada.</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !selectedUnitId}>
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Associação
        </Button>
      </div>
    </form>
  );
};
