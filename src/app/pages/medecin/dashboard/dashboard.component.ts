import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { FormsModule } from '@angular/forms';

import {
  DoctorDashboardService,
  DoctorDashboardStats,
  PathologyTrend,
  RevenueByMonth
} from '../../../services/doctor-dashboard.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: DoctorDashboardStats | null = null;
  loading = true;
  downloadingPDF = false;
  filter: '7' | '30' | '90' | '365' = '30';
  autoRefreshInterval: any;

  constructor(private service: DoctorDashboardService) {}

  ngOnInit(): void {
    this.loadStats();

    // Auto-refresh toutes les 2 minutes
    this.autoRefreshInterval = setInterval(() => {
      this.loadStats(false);
    }, 120000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
  }

  setFilter(f: '7' | '30' | '90' | '365') {
    if (this.filter === f) return;
    this.filter = f;
    this.loadStats();
  }

  loadStats(showLoader = true) {
    if (showLoader) this.loading = true;

    this.service.getStats(this.filter).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        setTimeout(() => this.createAllCharts(), 50);
      },
      error: () => (this.loading = false)
    });
  }

  downloadPDF() {
    this.downloadingPDF = true;

    this.service.downloadPDF(this.filter).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-medecin-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingPDF = false;
      },
      error: () => (this.downloadingPDF = false)
    });
  }

  private createAllCharts() {
    if (!this.stats) return;

    ['#status-pie', '#pathology-bar', '#calendar-heatmap', '#revenue-bar', '#appointments-line']
      .forEach(id => {
        const el = document.querySelector(id);
        if (el) el.innerHTML = '';
      });

    this.createStatusPie();
    this.createPathologyBar();
    this.createCalendarHeatmap();
    this.createRevenueBar();
    this.createAppointmentsLine();
  }

  // === PIE: RÉPARTITION PAR STATUT ===
  private createStatusPie() {
    const data = this.stats?.data.time_distribution || [];
    const container = d3.select('#status-pie');
    container.selectAll('*').remove();

    if (data.length === 0 || data.every(d => d.value === 0)) {
      container.append('p')
        .text('Aucune donnée disponible')
        .style('color', '#9ca3af')
        .style('padding', '40px')
        .style('text-align', 'center')
        .style('font-size', '14px');
      return;
    }

    const width = 340;
    const height = 340;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(['#1565c0', '#10b981', '#ef4444', '#fbbf24']);

    const pie = d3.pie<any>().value((d: any) => d.value).sort(null);
    const arc = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius);
    const arcHover = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius + 8);

    const arcs = svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('fill', (d: any) => color(d.data.label))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
      })
      .append('title')
      .text((d: any) => `${d.data.label}: ${d.data.value} (${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%)`);

    arcs.transition()
      .duration(700)
      .attrTween('d', function(d: any) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t: number) => arc(i(t)) as string;
      });

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(-${width / 2 + 10}, ${radius + 30})`);

    const legendItems = legend.selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${(i % 2) * 170}, ${Math.floor(i / 2) * 20})`);

    legendItems.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', d => color(d.label))
      .attr('rx', 3);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(d => `${d.label} (${d.value})`);
  }

  // === BAR CHART: TOP PATHOLOGIES ===
  private createPathologyBar() {
    const trends: PathologyTrend[] = this.stats?.data.pathology_trends || [];
    const container = d3.select('#pathology-bar');
    container.selectAll('*').remove();

    if (trends.length === 0) {
      container.append('p')
        .text('Aucune pathologie enregistrée')
        .style('color', '#9ca3af')
        .style('padding', '40px')
        .style('text-align', 'center')
        .style('font-size', '14px');
      return;
    }

    // Agréger par motif
    const totals = new Map<string, number>();
    trends.forEach(t => {
      totals.set(t.motif, (totals.get(t.motif) || 0) + t.count);
    });

    const data = Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const margin = { top: 20, right: 20, bottom: 100, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 1])
      .range([height, 0])
      .nice();

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px')
      .style('font-weight', '600');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .style('font-size', '11px')
      .style('font-weight', '600');

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label)!)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', '#1565c0')
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        d3.select(this).attr('fill', '#1a237e');
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#1565c0');
      })
      .append('title')
      .text(d => `${d.label}: ${d.value} cas`);
  }

  // === CALENDAR HEATMAP ===
  private createCalendarHeatmap() {
    const data = this.stats?.data.calendar_heatmap || [];
    const container = d3.select('#calendar-heatmap');
    container.selectAll('*').remove();

    if (data.length === 0) {
      container.append('p')
        .text('Aucune activité enregistrée')
        .style('color', '#9ca3af')
        .style('padding', '30px')
        .style('text-align', 'center')
        .style('font-size', '14px');
      return;
    }

    const values = new Map<string, number>();
    data.forEach(d => values.set(d.date, d.count));

    const parseDate = d3.timeParse('%Y-%m-%d');
    const dates = Array.from(values.keys())
      .map(s => parseDate(s)!)
      .filter(d => d !== null)
      .sort((a, b) => +a - +b);

    if (dates.length === 0) return;

    const min = d3.min(dates)!;
    const max = d3.max(dates)!;
    const dateRange = d3.timeDays(d3.timeDay.floor(min), d3.timeDay.ceil(max));

    const cols = 14;
    const cellSize = 20;
    const width = cols * (cellSize + 4);
    const rows = Math.ceil(dateRange.length / cols);
    const height = rows * (cellSize + 6);

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

    const maxValue = d3.max(Array.from(values.values())) || 1;
    const color = d3.scaleLinear<string>()
      .domain([0, maxValue])
      .range(['#e6eefb', '#1565c0']);

    dateRange.forEach((d, i) => {
      const x = (i % cols) * (cellSize + 4);
      const y = Math.floor(i / cols) * (cellSize + 6);
      const key = d3.timeFormat('%Y-%m-%d')(d);
      const v = values.get(key) || 0;

      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 4)
        .attr('fill', color(v))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .append('title')
        .text(`${key}: ${v} RDV`);
    });
  }

  // === BAR CHART: REVENUS PAR MOIS ===
  private createRevenueBar() {
    const data: RevenueByMonth[] = this.stats?.data.revenue_by_month || [];
    const container = d3.select('#revenue-bar');
    container.selectAll('*').remove();

    if (data.length === 0) {
      container.append('p')
        .text('Aucun revenu enregistré')
        .style('color', '#9ca3af')
        .style('padding', '30px')
        .style('text-align', 'center')
        .style('font-size', '14px');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 60, left: 70 };
    const width = 700 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.month_formatted))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.revenue) || 0) * 1.1])
      .range([height, 0])
      .nice();

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '600');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d: any) => `${(d / 1000).toFixed(0)}K`))
      .style('font-size', '11px')
      .style('font-weight', '600');

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month_formatted)!)
      .attr('y', d => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.revenue))
      .attr('fill', '#8b5cf6')
      .attr('rx', 6)
      .append('title')
      .text(d => `${d.month_formatted}\n${d.revenue.toLocaleString()} FCFA\n${d.count} RDV`);
  }

  // === LINE CHART: RENDEZ-VOUS PAR JOUR ===
  private createAppointmentsLine() {
    const data = this.stats?.data.appointments_by_day || [];
    const container = d3.select('#appointments-line');
    container.selectAll('*').remove();

    if (data.length === 0) {
      container.append('p')
        .text('Aucune activité enregistrée')
        .style('color', '#9ca3af')
        .style('padding', '30px')
        .style('text-align', 'center')
        .style('font-size', '14px');
      return;
    }

    const parse = d3.timeParse('%Y-%m-%d');
    const dataset = data.map(d => ({
      date: parse(d.date)!,
      value: d.count
    })).filter(d => d.date !== null);

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 760 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(dataset, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(dataset, d => d.value) || 0) * 1.15])
      .range([height, 0])
      .nice();

    const xAxis = d3.axisBottom(x)
      .ticks(8)
      .tickFormat(d3.timeFormat('%d/%m') as any);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('font-size', '11px')
      .style('font-weight', '600');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .style('font-size', '11px')
      .style('font-weight', '600');

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1565c0')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1565c0')
      .attr('stop-opacity', 0);

    // Area
    const area = d3.area<any>()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(dataset)
      .attr('fill', 'url(#line-gradient)')
      .attr('d', area as any);

    // Line
    svg.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#1565c0')
      .attr('stroke-width', 3)
      .attr('d', line as any);

    // Points
    svg.selectAll('circle')
      .data(dataset)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#1565c0')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `${d3.timeFormat('%d/%m/%Y')(d.date)}: ${d.value} RDV`);
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'EN ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'ANNULE': 'Annulé',
      'REPORT': 'Reporté'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'EN ATTENTE': 'status-pending',
      'CONFIRME': 'status-confirmed',
      'ANNULE': 'status-cancelled',
      'REPORT': 'status-rescheduled'
    };
    return classes[status] || '';
  }
}
