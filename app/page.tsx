"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, Package, Award, Users, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [year, setYear] = useState('2026');
  const [comprador, setComprador] = useState('Total');
  const [selectedMonths, setSelectedMonths] = useState([0, 11]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [year]);

  // Tipagem adicionada para evitar erro de compilação
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else current += char;
      }
      values.push(current.trim());
      return values;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const urls: Record<string, string> = {
        '2025': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTj1i7iGeyedT9bkuBME12GXPjIaIz8T7qpLCqetWuXt4Hoj0FP5Yh-WInFzxmIesDUacCO9DVGb-gS/pub?output=csv',
        '2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTj1i7iGeyedT9bkuBME12GXPjIaIz8T7qpLCqetWuXt4Hoj0FP5Yh-WInFzxmIesDUacCO9DVGb-gS/pub?gid=1265127929&single=true&output=csv'
      };
      const response = await fetch(urls[year]);
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      setData(parseSheetData(rows));
      setLoading(false);
    } catch (error) {
      console.error('Erro:', error);
      setLoading(false);
    }
  };

  const parseSheetData = (rows: any[]) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthIndexStart = 4;
    
    const findRow = (indicador: string, comp: string | null = null) => rows.find(r => 
      r[1]?.trim() === indicador && (comp ? r[2]?.trim() === comp : true)
    );

    const clean = (v: string | undefined) => {
      if (!v || v === '-' || v.includes('#')) return null;
      const n = parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
      return isNaN(n) ? null : n;
    };

    const compradores = ['Total', 'Ewerton', 'Leonardo', 'Luiz', 'Bruna', 'Lucas'];
    
    const timeline = months.map((month, idx) => {
      const col = monthIndexStart + idx;
      const obj: any = { month, monthIndex: idx };
      
      compradores.forEach(c => {
        const p = c === 'Total' ? '' : `${c}_`;
        obj[`${p}compras`] = clean(findRow('Compras R$', c)?.[col]) || 0;
        obj[`${p}saving`] = clean(findRow('Saving', c)?.[col]) || 0;
        obj[`${p}slaAtendimento`] = clean(findRow('SLA de Atendimento', c)?.[col]);
        obj[`${p}pmpGeral`] = clean(findRow('PMP Geral', c)?.[col]);
      });

      obj.slaEntregasTotal = clean(findRow('SLA Entregas no Prazo', 'Total')?.[col]);
      obj.slaEntregasProdutivo = clean(findRow('SLA Entregas no Prazo', 'Produtivo')?.[col]);
      obj.slaEntregasImprodutivo = clean(findRow('SLA Entregas no Prazo', 'Improdutivo')?.[col]);
      obj.pmpProdutivo = clean(findRow('PMP Produtivo', 'Total')?.[col]);
      obj.pmpImprodutivo = clean(findRow('PMP Improdutivo', 'Total')?.[col]);

      return obj;
    });

    return { timeline };
  };

  const getFilteredData = () => {
    if (!data) return null;
    const filtered = data.timeline.filter((i: any) => i.monthIndex >= selectedMonths[0] && i.monthIndex <= selectedMonths[1]);
    const p = comprador === 'Total' ? '' : `${comprador}_`;

    const avg = (field: string) => {
      const vals = filtered.map((i: any) => i[field]).filter((v: any) => v !== null && v > 0);
      return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    };

    return {
      comprasTotal: filtered.reduce((s: number, i: any) => s + (i[`${p}compras`] || 0), 0),
      savingTotal: filtered.reduce((s: number, i: any) => s + (i[`${p}saving`] || 0), 0),
      slaAtendimentoMedia: avg(`${p}slaAtendimento`),
      slaEntregasProdutivo: avg('slaEntregasProdutivo'),
      slaEntregasImprodutivo: avg('slaEntregasImprodutivo'),
      pmpProdutivo: avg('pmpProdutivo'),
      pmpImprodutivo: avg('pmpImprodutivo'),
      timeline: filtered
    };
  };

  const fCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  const fPercent = (v: number) => (v || 0).toFixed(1) + '%';

  if (loading) return <div className="flex h-screen items-center justify-center font-sans text-slate-500">Carregando dados de {year}...</div>;

  const fData = getFilteredData();
  if (!fData) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Compras {year}</h1>
            <p className="text-slate-500">Monitoramento de KPI por Categoria e Comprador</p>
          </div>
          
          <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <Select value={comprador} onValueChange={setComprador}>
                <SelectTrigger className="w-32 border-none font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Total', 'Ewerton', 'Leonardo', 'Luiz', 'Bruna', 'Lucas'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <Select value={selectedMonths[0].toString()} onValueChange={v => setSelectedMonths([parseInt(v), selectedMonths[1]])}>
                <SelectTrigger className="w-28 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m,i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <span>até</span>
              <Select value={selectedMonths[1].toString()} onValueChange={v => setSelectedMonths([selectedMonths[0], parseInt(v)])}>
                <SelectTrigger className="w-28 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m,i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="opacity-80 text-sm font-medium">Compras Acumuladas</p>
                  <h3 className="text-3xl font-bold mt-1">{fCurrency(fData.comprasTotal)}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg"><DollarSign className="w-6 h-6" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="opacity-80 text-sm font-medium">Saving Gerado</p>
                  <h3 className="text-3xl font-bold mt-1">{fCurrency(fData.savingTotal)}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">SLA Atendimento</p>
                  <h3 className={`text-3xl font-bold mt-1 ${fData.slaAtendimentoMedia >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {fPercent(fData.slaAtendimentoMedia)}
                  </h3>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Target className="w-6 h-6" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg">Volume vs Economia Mensal</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" />
                    <Bar name="Compras" dataKey={comprador === 'Total' ? 'compras' : `${comprador}_compras`} fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar name="Saving" dataKey={comprador === 'Total' ? 'saving' : `${comprador}_saving`} fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg">Visão por Grupo (Produtivo vs Improdutivo)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Entrega Produtivo</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{fPercent(fData.slaEntregasProdutivo)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Entrega Improdutivo</p>
                    <p className="text-2xl font-bold text-indigo-500 mt-1">{fPercent(fData.slaEntregasImprodutivo)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prazo Pgto Produtivo</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{fData.pmpProdutivo.toFixed(0)} <span className="text-sm font-normal text-slate-400">dias</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prazo Pgto Improdutivo</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{fData.pmpImprodutivo.toFixed(0)} <span className="text-sm font-normal text-slate-400">dias</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
