import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle } from 'lucide-react';

// --- INÍCIO DA REATORAÇÃO ---

// 1. SIMPLIFICAR AS PROPS: REMOVER 'unitId'
interface AddItemFormProps {
  onItemAdded: (newItem?: any) => void;
  onCancel: () => void;
  token: string | null;
}

export const AddItemForm = ({ onItemAdded, onCancel, token }: AddItemFormProps) => {
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [quantity, setQuantity] = useState<string | number>(''); // Inicia vazio
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // A quantidade pode ser 0, mas o nome é obrigatório
    if (!name) {
      setError('O nome do item é obrigatório.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // 2. REMOVER 'unitId' DO CORPO DA REQUISIÇÃO
        body: JSON.stringify({
          name,
          internalCode,
          unitOfMeasure,
          description,
          quantity: Number(quantity),
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        onItemAdded(newItem);
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao adicionar o item.');
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
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Notebook Dell Vostro"
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="internalCode">Código Interno/SKU</Label>
          <Input
            id="internalCode"
            value={internalCode}
            onChange={(e) => setInternalCode(e.target.value)}
            placeholder="Ex: NTB-001"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
          <Input
            id="unitOfMeasure"
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            placeholder="Ex: Un, Kg, Lt"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          min="0"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Tela 15.6, 16GB RAM, 512GB SSD"
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
          Adicionar ao Estoque
        </Button>
      </div>
    </form>
  );
};

// --- FIM DA REATORAÇÃO ---
