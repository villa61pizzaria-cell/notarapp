import React from 'react';
import { Database, Server, Smartphone, Globe, Shield, ArrowRight, MessageSquare, HardDrive, Lock, Cpu, CloudLightning, GitBranch, RefreshCw } from 'lucide-react';

const ArchitectureDocs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Arquitetura de Produção: Notar 2.0</h1>
        <p className="text-lg text-slate-600">Guia de implementação e ciclo de vida do software.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl flex items-start gap-4">
        <CloudLightning className="text-blue-600 shrink-0 mt-1" />
        <div>
            <h3 className="font-bold text-blue-900">Status dos Arquivos Gerados</h3>
            <p className="text-blue-800 text-sm mt-1">
                Acabei de gerar os arquivos reais na pasta <code>/server</code>. Eles contêm a implementação de WebSockets, Upload para S3 e conexão com PostgreSQL. O Frontend atual continua rodando em "Modo Demonstração" (Mock), mas está pronto para conectar a esse backend.
            </p>
        </div>
      </div>

      {/* Ciclo de Atualização (Resposta à dúvida do usuário) */}
      <section className="bg-slate-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
            <RefreshCw className="text-green-400" /> Como atualizar o App após o Deploy?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 relative z-10">
             <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                 <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold">1</div>
                     <h3 className="font-bold">Desenvolvimento</h3>
                 </div>
                 <p className="text-sm text-slate-300">
                     Você pede alterações aqui na IA. Eu gero o novo código.
                     <br/><br/>
                     <span className="text-xs bg-black/30 px-2 py-1 rounded">Onde estamos agora</span>
                 </p>
             </div>

             <div className="flex items-center justify-center md:rotate-0 rotate-90">
                 <ArrowRight className="text-slate-500" size={32} />
             </div>

             <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                 <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center font-bold"><GitBranch size={16}/></div>
                     <h3 className="font-bold">GitHub (Código)</h3>
                 </div>
                 <p className="text-sm text-slate-300">
                     Você copia o código novo daqui e envia (push) para o seu repositório no GitHub.
                 </p>
             </div>

             <div className="md:col-span-3 mt-4 bg-green-900/30 p-4 rounded-lg border border-green-500/30 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold shrink-0">
                     <Globe />
                 </div>
                 <div>
                     <h3 className="font-bold text-green-400">Deploy Automático (CI/CD)</h3>
                     <p className="text-sm text-green-200">
                         Plataformas como <strong>Vercel, Render ou Railway</strong> detectam a mudança no GitHub e atualizam o site sozinhas em minutos.
                     </p>
                 </div>
             </div>
        </div>
      </section>

      {/* High Level Diagram Representation */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Globe className="text-blue-500" /> Fluxo de Dados Real (Produção)
        </h2>
        
        <div className="flex flex-col space-y-8">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800">App React</h3>
                        <p className="text-sm text-slate-500">Cliente envia imagem no Chat</p>
                    </div>
                    <ArrowRight className="text-slate-400" />
                    <div className="text-right">
                        <h3 className="font-semibold text-slate-800">Node.js API</h3>
                        <p className="text-sm text-slate-500">POST /api/chat/upload</p>
                    </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
                <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800">Backend Server</h3>
                        <p className="text-sm text-slate-500">Recebe stream do arquivo</p>
                    </div>
                    <ArrowRight className="text-slate-400" />
                    <div className="text-right">
                        <h3 className="font-semibold text-slate-800">AWS S3 / Firebase</h3>
                        <p className="text-sm text-slate-500">Armazena e devolve URL</p>
                    </div>
                </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">3</div>
                <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800">Backend Worker</h3>
                        <p className="text-sm text-slate-500">Envia URL para Gemini</p>
                    </div>
                    <ArrowRight className="text-slate-400" />
                    <div className="text-right">
                        <h3 className="font-semibold text-slate-800">Socket.io</h3>
                        <p className="text-sm text-slate-500">Avisa painel do Contador (Realtime)</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Como Implantar (Passo a Passo)</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                      <Server className="text-slate-600" />
                      <h3 className="font-bold">1. Subir o Backend</h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                      <li>Copie a pasta <code>/server</code> gerada.</li>
                      <li>Hospede em: <strong>Render, Railway, Heroku ou DigitalOcean</strong>.</li>
                      <li>Configure as variáveis de ambiente (veja <code>.env.example</code>).</li>
                  </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                      <Database className="text-slate-600" />
                      <h3 className="font-bold">2. Banco de Dados</h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                      <li>Crie um banco PostgreSQL (Ex: <strong>Supabase</strong> ou <strong>Neon.tech</strong>).</li>
                      <li>Rode o script <code>schema.sql</code> gerado na query tool do banco.</li>
                      <li>Pegue a Connection String e coloque no <code>.env</code> do Backend.</li>
                  </ul>
              </div>
          </div>
      </section>

      {/* Code Snippets */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="text-purple-500" /> Snippets Essenciais
        </h2>

        <div>
            <h4 className="font-semibold text-slate-700 mb-2">Schema SQL (Resumo)</h4>
            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
<pre className="text-green-400 font-mono text-sm leading-relaxed">
{`-- Tabela de Recibos Otimizada
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL, -- URL do S3
    ocr_data JSONB,          -- Dados brutos
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);`}
</pre>
            </div>
        </div>
      </section>

    </div>
  );
};

export default ArchitectureDocs;