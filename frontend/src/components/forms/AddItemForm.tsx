import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle } from 'lucide-react';

// --- INÍCIO DA REATORAÇÃO ---

// 1. SIMPLIFICAR AS PROPS: REMOVER 'unitId'
interface AddItemFormProps {
  onItemAdded: () => void;
  onCancel: () => void;
  token: string | null;
}

export const AddItemForm = ({ onItemAdded, onCancel, token }: AddItemFormProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0); // A quantidade inicial pode ser 0
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
          description,
          quantity,
        } ),
      });

      if (response.ok) {
        onItemAdded();
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
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade Inicial em Estoque</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="0" // Permite 0 como quantidade inicial
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
