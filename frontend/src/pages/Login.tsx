import { useState, useEffect, useRef } from "react"; // 1. Importar useEffect e useRef
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth.context";
import VanillaTilt from 'vanilla-tilt'; // 2. Importar a biblioteca vanilla-tilt

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // --- INÍCIO DAS NOVAS ALTERAÇÕES ---
  // 3. Criar uma referência para o nosso card de login
  const tiltRef = useRef<HTMLDivElement>(null);
  // --- FIM DAS NOVAS ALTERAÇÕES ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password } ),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Login realizado com sucesso!");
        login(data.user, data.token);
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Ocorreu um erro no login.");
      }
    } catch (error) {
      console.error("Falha na requisição de login:", error);
      toast.error("Não foi possível conectar ao servidor. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- INÍCIO DAS NOVAS ALTERAÇÕES ---
  // 4. Usar useEffect para inicializar o efeito de inclinação
  useEffect(() => {
    if (tiltRef.current) {
      VanillaTilt.init(tiltRef.current, {
        max: 8,          // Inclinação máxima em graus
        speed: 100,       // Velocidade da animação
        glare: true,      // Adiciona um efeito de brilho
        "max-glare": 0.6, // Intensidade do brilho
      });
    }
  }, []); // O array vazio [] garante que isso rode apenas uma vez, quando o componente monta
  // --- FIM DAS NOVAS ALTERAÇÕES ---

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
        Seu navegador não suporta o vídeo de fundo.
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>

      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        {/* 5. Associar a referência ao nosso card */}
        <div ref={tiltRef} className="w-full max-w-md space-y-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl p-8">
          
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-white">
              Login
            </h1>
            <img src="/StockHUB_SemFundo.png" alt="StockHUB" className="mx-auto w-20 h-auto" />
            <p className="text-white/70 text-sm">Bem-vindo ao <strong>StockHub</strong>, <i>seu sistema de Inventário.</i></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 focus:ring-offset-0 focus:ring-white/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 pr-10 focus:ring-offset-0 focus:ring-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  aria-label="Mostrar/ocultar senha"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Esqueceu sua senha?
                </a>
            </div>

            <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 font-bold text-base py-6" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : null}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
