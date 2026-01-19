"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [year, setYear] = useState('2026');
  const [comprador, setComprador] = useState('Total');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use os links CSV gerados em "Arquivo > Publicar na Web" para cada aba
      const urls: any = {
        '2025': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTj1i7iGeyedT9bkuBME12GXPjIaIz8T7qpLCqetWuXt4Hoj0FP5Yh-WInFzxmIesDUacCO9DVGb-gS/pub?output=csv',
        '2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTj1i7iGeyedT9bkuBME12GXPjIaIz8T7qpLCqetWuXt4Hoj0FP5Yh-WInFzxmIesDUacCO9DVGb-gS/pub?gid=1265127929&single=true&output=csv'
      };
      const response = await fetch(urls[year]);
      const csvText = await response.text();
      const rows = csvText.split('\n').map(line => line.split(',').map(cell => cell.replace(/"/g, '').trim()));
      
      setData(parseVerticalData(rows, year));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year]);

  const parseVerticalData = (rows: any[], targetYear: string) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const clean = (v: any) => {
      if (!v || v === '-' || v.includes('#')) return 0;
      // Trata números brasileiros (259.660,25) para o formato computacional (259660.25)
      const n = parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
      return isNaN(n) ? 0 : n;
    };

    return {
      timeline: months.map(m => {
        const monthData: any = { month: m };
        // Filtra linhas baseadas na Coluna B (Ano) e Coluna C (Mês) da imagem vertical
        const filteredRows = rows.filter(r => r[1] === targetYear && r[2] === m);
        
        const buyers = ['Total', 'ewerton', 'leonardo', 'luiz', 'bruna', 'lucas'];
        buyers.forEach(c => {
          const prefix = c === 'Total' ? '' : `${c}_`;
          // Busca "Compras R$" na Coluna D e o comprador na Coluna F, pega valor na Coluna G
          const comprasRow = filteredRows.find(r => r[3] === 'Compras R$' && r[5].toLowerCase() === c.toLowerCase());
          const savingRow = filteredRows.find(r => r[3] === 'Saving' && r[5].toLowerCase() === c.toLowerCase());
          const slaRow = filteredRows.find(r => r[3] === 'SLA Atendimento' && r[5].toLowerCase() === c.toLowerCase());
          
          monthData[`${prefix}compras`] = clean(comprasRow?.[6]);
          monthData[`${prefix}saving`] = clean(savingRow?.[6]);
          monthData[`${prefix}slaAtendimento`] = clean(slaRow?.[6]) * 100;
        });
        return monthData;
      })
    };
  };

  const getFilteredData = () => {
    if (!data) return null;
    const p = comprador === 'Total' ? '' : `${comprador.toLowerCase()}_`;
    const timeline = data.timeline;

    return {
      comprasTotal: timeline.reduce((s: number, i: any) => s + (i[`${p}compras`] || 0), 0),
      savingTotal: timeline.reduce((s: number, i: any) => s + (i[`${p}saving`] || 0), 0),
      slaAtendimentoMedia: timeline.reduce((s: number, i: any) => s + (i[`${p}slaAtendimento`] || 0), 0) / 12,
      timeline
    };
  };

  const fCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  
  if (loading) return <div className="flex h-screen items-center justify-center font-sans">Carregando dados de {year}...</div>;
  const fData = getFilteredData();
  if (!fData) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Painel de Compras {year}</h1>
          <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm border">
            <Select value={year} onValueChange={setYear}>
               <SelectTrigger className="w-24 border-none font-medium"><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="2025">2025</SelectItem>
                 <SelectItem value="2026">2026</SelectItem>
               </SelectContent>
            </Select>
            <Select value={comprador} onValueChange={setComprador}>
              <SelectTrigger className="w-36 border-none font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Total', 'Ewerton', 'Leonardo', 'Luiz', 'Bruna', 'Lucas'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-700 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm opacity-80 font-medium">Compras Acumuladas</p><h3 className="text-3xl font-bold mt-1">{fCurrency(fData.comprasTotal)}</h3></div>
                <DollarSign className="w-10 h-10 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-700 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm opacity-80 font-medium">Saving Total</p><h3 className="text-3xl font-bold mt-1">{fCurrency(fData.savingTotal)}</h3></div>
                <TrendingUp className="w-10 h-10 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-slate-500 font-medium">Média SLA Atendimento</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{fData.slaAtendimentoMedia.toFixed(1)}%</h3></div>
                <Target className="w-10 h-10 text-blue-600 opacity-10" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50"><CardTitle className="text-slate-700 text-lg">Histórico Mensal: Volume vs Saving</CardTitle></CardHeader>
          <CardContent className="h-[400px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fData.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Bar name="Compras" dataKey={comprador === 'Total' ? 'compras' : `${comprador.toLowerCase()}_compras`} fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar name="Saving" dataKey={comprador === 'Total' ? 'saving' : `${comprador.toLowerCase()}_saving`} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
