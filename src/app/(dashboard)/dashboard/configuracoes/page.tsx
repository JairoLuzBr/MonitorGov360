import type { Metadata } from "next";
import { Settings, User, Shield, Bell, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Configurações",
};

const secoes = [
  {
    titulo: "Perfil do Usuário",
    descricao: "Nome, e-mail, foto e dados pessoais",
    icone: User,
    cor: "text-blue-600 bg-blue-50",
  },
  {
    titulo: "Segurança",
    descricao: "Senha, MFA e sessões ativas",
    icone: Shield,
    cor: "text-emerald-600 bg-emerald-50",
  },
  {
    titulo: "Notificações",
    descricao: "Push, e-mail e alertas in-app",
    icone: Bell,
    cor: "text-amber-600 bg-amber-50",
  },
  {
    titulo: "Município",
    descricao: "Dados institucionais e órgãos vinculados",
    icone: Building2,
    cor: "text-primary-600 bg-primary-50",
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          Configurações
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Personalize sua experiência e gerencie as configurações da conta
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {secoes.map((sec) => (
          <button
            key={sec.titulo}
            type="button"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all text-left hover:border-primary-300"
          >
            <div className="flex items-start gap-4">
              <div className={`${sec.cor} w-11 h-11 rounded-lg flex items-center justify-center shrink-0`}>
                <sec.icone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{sec.titulo}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sec.descricao}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
