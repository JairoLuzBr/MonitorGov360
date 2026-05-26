"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Camera, CheckCircle2 } from "lucide-react";
import { UploadEvidencia } from "@/components/evidencias/upload-evidencia";

export default function UploadEvidenciaPage() {
  const [concluido, setConcluido] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/evidencias"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para evidências
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-3">
          <Camera className="h-6 w-6 text-primary-600" />
          Nova Evidência
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Anexe arquivos, vincule a uma ação e registre informações de contexto
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {concluido ? (
          <div className="text-center py-12 space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Evidência registrada com sucesso!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sua evidência foi vinculada à ação selecionada e já está disponível na listagem.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/evidencias"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <button
                type="button"
                onClick={() => setConcluido(false)}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                Enviar outra
              </button>
            </div>
          </div>
        ) : (
          <UploadEvidencia onSuccess={() => setConcluido(true)} />
        )}
      </div>
    </div>
  );
}
