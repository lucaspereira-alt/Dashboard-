"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Target, Clock, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [year, setYear] = useState('2026');
  const [comprador, setComprador] = useState('Total');
  const [selectedMonths, setSelectedMonths] = useState([0, 11]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const urls: any = {
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
    fetchData();
  }, [year]);

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

  const parseSheetData = (rows: any[]) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthIndexStart = 4;
    const findRow = (indicador: string, comp: string | null = null) => rows.find(r => 
      r[1]?.trim() === indicador && (comp ? r[2]?.trim() === comp : true)
    );
    const clean = (v: any) => {
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
      });
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

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando dados...</div>;
  const fData = getFilteredData();
  if (!fData) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Compras {year}</h1>
          </div>
          <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm border">
            <Select value={comprador} onValueChange={setComprador}>
              <SelectTrigger className="w-32 border-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Total', 'Ewerton', 'Leonardo', 'Luiz', 'Bruna', 'Lucas'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-600 text-white border-none">
            <CardContent className="pt-6">
              <p className="text-sm opacity-80">Compras Acumuladas</p>
              <h3 className="text-3xl font-bold">{fCurrency(fData.comprasTotal)}</h3>
            </CardContent>
          </Card>
          <Card className="bg-emerald-600 text-white border-none">
            <CardContent className="pt-6">
              <p className="text-sm opacity-80">Saving Gerado</p>
              <h3 className="text-3xl font-bold">{fCurrency(fData.savingTotal)}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white border-none">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">SLA Atendimento</p>
              <h3 className="text-3xl font-bold text-slate-900">{fPercent(fData.slaAtendimentoMedia)}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Volume vs Economia</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Compras" dataKey={comprador === 'Total' ? 'compras' : `${comprador}_compras`} fill="#2563eb" />
                  <Bar name="Saving" dataKey={comprador === 'Total' ? 'saving' : `${comprador}_saving`} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 font-bold uppercase">SLA Produtivo</p>
                    <p className="text-2xl font-bold text-blue-600">{fPercent(fData.slaEntregasProdutivo)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 font-bold uppercase">SLA Improdutivo</p>
                    <p className="text-2xl font-bold text-indigo-500">{fPercent(fData.slaEntregasImprodutivo)}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
