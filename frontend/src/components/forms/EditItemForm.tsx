import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasure?: string | null;
  internalCode?: string | null;
  quantity: number;
}

interface EditItemFormProps {
  item: Item;
  onItemUpdated: () => void;
  onCancel: () => void;
  token: string | null;
}

export const EditItemForm = ({ item, onItemUpdated, onCancel, token }: EditItemFormProps) => {
  const [name, setName] = useState(item.name);
  const [internalCode, setInternalCode] = useState(item.internalCode || '');
  const [unitOfMeasure, setUnitOfMeasure] = useState(item.unitOfMeasure || '');
  const [quantity, setQuantity] = useState<string | number>(item.quantity);
  const [description, setDescription] = useState(item.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, internalCode, unitOfMeasure, description, quantity: Number(quantity) }),
      });

      if (response.ok) {
        onItemUpdated();
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao atualizar o item.');
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
        <Label htmlFor="name">Nome do Item</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="internalCode">Código Interno/SKU</Label>
          <Input
            id="internalCode"
            value={internalCode}
            onChange={(e) => setInternalCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
          <Input
            id="unitOfMeasure"
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade em Estoque</Label>
        {/* A única alteração é permitir 0 como quantidade */}
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onFocus={(e) => e.target.select()}
          min="0"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
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
