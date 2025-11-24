import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

import {
  DoctorDashboardService,
  DoctorDashboardStats,
  PathologyTrend,
  RevenueByMonth,
  TimeDistribution
} from '../../../services/doctor-dashboard.service';
import { AppointmentByDay } from '../../../services/dashboard.admin.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
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

    ['#status-pie', '#pathology-stream', '#calendar-heatmap', '#revenue-bar', '#appointments-line', '#polar-motifs']
      .forEach(id => {
        const el = document.querySelector(id);
        if (el) el.innerHTML = '';
      });

    this.createStatusPie();
    this.createPathologyStream();
    this.createCalendarHeatmap();
    this.createRevenueBar();
    this.createAppointmentsLine();
    this.createPolarMotifs();
  }

  // === PIE: TIME DISTRIBUTION ===
  private createStatusPie() {
    const data: TimeDistribution[] = this.stats?.data.time_distribution || [];
    const container = d3.select('#status-pie');
    container.selectAll('*').remove();

    const width = 260, height = 260, radius = Math.min(width, height) / 2;

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(['#3b82f6', '#10b981', '#ef4444', '#fbbf24']);

    const pie = d3.pie<any>().value((d: any) => d.value).sort(null);
    const arc = d3.arc<any>().innerRadius(radius * 0.45).outerRadius(radius * 0.9);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('fill', (d: any) => color(d.data.label))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .transition()
      .duration(700)
      .attrTween('d', function (d: any) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => arc(i(t)) as string;
      });

    // Legend
    const legendSvg = container.append('svg')
      .attr('width', width)
      .attr('height', 50)
      .append('g')
      .attr('transform', 'translate(10,10)');

    const lg = legendSvg.selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${i * 120},0)`);

    lg.append('rect').attr('width', 12).attr('height', 12).attr('fill', d => color(d.label));
    lg.append('text').attr('x', 18).attr('y', 11).style('font-size', '12px').text(d => `${d.label} (${d.value})`);
  }

  // === STREAMGRAPH ===
  private createPathologyStream() {
    const trends: PathologyTrend[] = this.stats?.data.pathology_trends || [];
    const container = d3.select('#pathology-stream');
    container.selectAll('*').remove();

    if (!trends.length) {
      container.append('p')
        .text('Aucune donnée pathologie')
        .style('color', '#999')
        .style('padding', '40px 0')
        .style('text-align', 'center');
      return;
    }

    const parseMonth = d3.timeParse('%Y-%m');

    const monthsSet = new Set<string>();
    const motifsSet = new Set<string>();

    trends.forEach(t => {
      monthsSet.add(t.month);
      motifsSet.add(t.motif);
    });

    const months = Array.from(monthsSet).sort();
    const motifs = Array.from(motifsSet);

    const dataMap = new Map<string, any>();
    months.forEach(m => {
      const obj: any = { month: parseMonth(m) || new Date() };
      motifs.forEach(mt => obj[mt] = 0);
      dataMap.set(m, obj);
    });

    trends.forEach(t => {
      const row = dataMap.get(t.month);
      if (row) row[t.motif] = t.count;
    });

    const dataset = Array.from(dataMap.values());

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 860 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const stack = d3.stack()
      .keys(motifs)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetWiggle);

    const series = stack(dataset as any);

    const x = d3.scaleTime()
      .domain(d3.extent(dataset, (d: any) => d.month) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(series, s => d3.min(s, (d: any) => d[0])) || 0,
        d3.max(series, s => d3.max(s, (d: any) => d[1])) || 1
      ])
      .range([height, 0])
      .nice();

    const area = d3.area<any>()
      .x(d => x(d.data.month))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(motifs);

    svg.selectAll('path')
      .data(series)
      .enter()
      .append('path')
      .attr('d', area as any)
      .attr('fill', (_, i) => color(String(i)) as string)
      .attr('opacity', 0.85);

    const xAxis = d3.axisBottom(x)
      .ticks(6)
      .tickFormat(d3.timeFormat('%b %Y') as any);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g').call(d3.axisLeft(y).ticks(4));
  }

  // === HEATMAP ===
  private createCalendarHeatmap() {
    const data = this.stats?.data.calendar_heatmap || [];
    const container = d3.select('#calendar-heatmap');
    container.selectAll('*').remove();

    if (!data.length) {
      container.append('p')
        .text('Aucune activité')
        .style('color', '#999')
        .style('padding', '30px')
        .style('text-align', 'center');
      return;
    }

    const values = new Map<string, number>();
    data.forEach(d => values.set(d.date, d.count));

    const parseDate = d3.timeParse('%Y-%m-%d');

    const dates = Array.from(values.keys())
      .map(s => parseDate(s)!)
      .sort((a, b) => +a - +b);

    const min = d3.min<Date>(dates)!;
    const max = d3.max<Date>(dates)!;

    const dateRange = d3.timeDays(d3.timeDay.floor(min), d3.timeDay.ceil(max));

    const cols = 14;
    const cellSize = 18;

    const width = cols * (cellSize + 4);
    const rows = Math.ceil(dateRange.length / cols);
    const height = rows * (cellSize + 6);

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

    const maxValue = d3.max(Array.from(values.values())) || 1;

    const color = d3.scaleLinear<string>()
      .domain([0, maxValue])
      .range(['#f1f5f9', '#0ea5e9']);

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
        .attr('stroke', '#e6eef8')
        .append('title')
        .text(`${key}: ${v} RDV`);
    });
  }

  // === BAR CHART REVENUE ===
  private createRevenueBar() {
    const data: RevenueByMonth[] = this.stats?.data.revenue_by_month || [];
    const container = d3.select('#revenue-bar');
    container.selectAll('*').remove();

    if (!data.length) {
      container.append('p')
        .text('Aucun revenu enregistré')
        .style('color', '#999')
        .style('padding', '30px')
        .style('text-align', 'center');
      return;
    }

    const margin = { top: 16, right: 16, bottom: 40, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.month_formatted))
      .range([0, width])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.revenue) || 0) * 1.15])
      .range([height, 0])
      .nice();

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(y).ticks(5));

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.month_formatted)!)
      .attr('y', d => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.revenue))
      .attr('fill', '#8b5cf6')
      .attr('rx', 6)
      .append('title')
      .text(d => `${d.month_formatted}: ${d.revenue} XOF`);
  }

  // === LINE CHART APPOINTMENTS ===
  private createAppointmentsLine() {
    const data: AppointmentByDay[] = this.stats?.data.appointments_by_day || [];
    const container = d3.select('#appointments-line');
    container.selectAll('*').remove();

    if (!data.length) {
      container.append('p')
        .text('Aucune activité')
        .style('color', '#999')
        .style('padding', '30px')
        .style('text-align', 'center');
      return;
    }

    const parse = d3.timeParse('%Y-%m-%d');
    const dataset = data.map(d => ({
      date: parse(d.date)!,
      value: d.count
    }));

    const margin = { top: 10, right: 20, bottom: 30, left: 50 };
    const width = 760 - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(dataset, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(dataset, d => d.value) || 0) * 1.2])
      .range([height, 0])
      .nice();

    const xAxis = d3.axisBottom(x)
      .ticks(6)
      .tickFormat(d3.timeFormat('%d %b') as any);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g').call(d3.axisLeft(y).ticks(4));

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#1565c0')
      .attr('stroke-width', 3)
      .attr('d', line as any);

    svg.selectAll('circle')
      .data(dataset)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#1565c0')
      .append('title')
      .text(d => `${d3.timeFormat('%d/%m/%Y')(d.date)}: ${d.value}`);
  }

  // === POLAR MOTIFS ===
  private createPolarMotifs() {
    const trends: PathologyTrend[] = this.stats?.data.pathology_trends || [];
    const container = d3.select('#polar-motifs');
    container.selectAll('*').remove();

    if (!trends.length) {
      container.append('p')
        .text('Aucun motif')
        .style('color', '#999')
        .style('padding', '30px')
        .style('text-align', 'center');
      return;
    }

    const totals = new Map<string, number>();
    trends.forEach(t => {
      totals.set(t.motif, (totals.get(t.motif) || 0) + t.count);
    });

    const top = Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const width = 360, height = 360;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const angle = d3.scaleBand()
      .domain(top.map(d => d.label))
      .range([0, Math.PI * 2])
      .padding(0.1);

    const r = d3.scaleLinear()
      .domain([0, d3.max(top, d => d.value) || 1])
      .range([10, radius]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    top.forEach((d, i) => {
      const a = (angle(d.label) || 0) - Math.PI / 2;
      const outer = r(d.value);

      const arc = d3.arc()
        .innerRadius(6)
        .outerRadius(outer)
        .startAngle(a - angle.bandwidth() / 2)
        .endAngle(a + angle.bandwidth() / 2);

      svg.append('path')
        .attr('d', arc as any)
        .attr('fill', color(String(i)));
    })}}





