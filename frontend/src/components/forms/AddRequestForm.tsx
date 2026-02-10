import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle } from 'lucide-react';
import { api } from "@/lib/api"; // <--- IMPORTANTE

interface CentralStockItem {
  id: string;
  name: string;
  quantity: number;
}

interface AddRequestFormProps {
  unitId: string;
  onSuccess: () => void;
  onCancel: () => void;
  token: string | null;
}

export const AddRequestForm = ({ unitId, onSuccess, onCancel }: AddRequestFormProps) => {
  const [availableItems, setAvailableItems] = useState<CentralStockItem[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(true);
  
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<string>('1');
  
  const [purpose, setPurpose] = useState<string | undefined>(undefined);
  const [observation, setObservation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCentralStockItems = async () => {
      setIsFetchingItems(true);
      try {
        // Substituído fetch por api
        const response = await api('/items');
        
        if (response.ok) {
          setAvailableItems(await response.json());
        } else {
          setError('Falha ao carregar os itens do estoque central.');
        }
      } catch (err) {
        setError('Erro de conexão ao buscar itens.');
      } finally {
        setIsFetchingItems(false);
      }
    };
    fetchCentralStockItems();
  }, []); // Sem dependência de token

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const qty = parseInt(quantity || '0', 10);
    if (!selectedItemId || qty <= 0 || !purpose) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Substituído fetch por api
      const response = await api('/requests', {
        method: 'POST',
        body: JSON.stringify({
          itemId: selectedItemId,
          quantity: qty,
          unitId,
          purpose,
          observation,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Falha ao criar a solicitação.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetchingItems) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
        <span>Carregando itens disponíveis...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="item">Item Solicitado (Estoque Central)</Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={isSubmitting}>
            <SelectTrigger id="item"><SelectValue placeholder="Selecione um item..." /></SelectTrigger>
            <SelectContent>
              {availableItems.length > 0 ? (
                availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Nenhum item no estoque central desta empresa.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Propósito</Label>
          <Select value={purpose} onValueChange={setPurpose} disabled={isSubmitting}>
            <SelectTrigger id="purpose"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AULA">Uso em Aula</SelectItem>
              <SelectItem value="PROJETO">Uso em Projeto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={quantity}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setQuantity(raw);
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="observation">Justificativa / Observação (Opcional)</Label>
          <Textarea id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Material para o projeto de robótica do 3º ano." disabled={isSubmitting} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting || availableItems.length === 0}>
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Solicitação
        </Button>
      </div>
    </form>
  );
};