import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { api } from "@/lib/api";

interface EditUnitItemFormProps {
  unitId: string;
  unitItemId: string;
  itemName: string;
  currentQuantity: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUnitItemForm = ({ unitId, unitItemId, itemName, currentQuantity, onSuccess, onCancel }: EditUnitItemFormProps) => {
  const [quantity, setQuantity] = useState<string | number>(currentQuantity);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api(`/units/${unitId}/items/${unitItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(quantity) || 0 }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao atualizar quantidade.');
      }
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Editando quantidade de <strong>{itemName}</strong></p>
      <div className="space-y-2">
        <Label htmlFor="edit-unit-item-qty">Quantidade na Unidade</Label>
        <Input
          id="edit-unit-item-qty"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onFocus={(e) => e.target.select()}
          min="0"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};
