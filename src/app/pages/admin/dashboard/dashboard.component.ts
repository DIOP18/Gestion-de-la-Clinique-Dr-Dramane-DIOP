import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import {DashboardAdminService, DashboardStats} from '../../../services/dashboard.admin.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats: DashboardStats | null = null;
  loading = true;
  selectedFilter = '30';
  downloadingPDF = false;

  filterOptions = [
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
    { value: '365', label: '1 an' }
  ];

  constructor(private dashboardService: DashboardAdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  loadStats(): void {
    this.loading = true;
    this.dashboardService.getStats(this.selectedFilter).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        // Attendre que le DOM soit mis à jour
        setTimeout(() => {
          this.createAllCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.loadStats();
  }

  downloadPDF(): void {
    this.downloadingPDF = true;
    this.dashboardService.downloadPDF(this.selectedFilter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-admin-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloadingPDF = false;
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du PDF:', error);
        this.downloadingPDF = false;
      }
    });
  }

  private createAllCharts(): void {
    if (!this.stats) return;

    this.createHeatmap();
    this.createTreemap();
    this.createBarChart();
    this.createNetworkGraph();
    this.createSankeyDiagram();
  }

  // ========== 1. HEATMAP TEMPORELLE ==========
  private createHeatmap(): void {
    const data = this.stats?.data.heatmap || [];
    const container = d3.select('#heatmap');
    container.selectAll('*').remove();

    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8h à 21h

    const x = d3.scaleBand()
      .range([0, width])
      .domain(hours.map(h => `${h}:00`))
      .padding(0.05);

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(days)
      .padding(0.05);

    const maxCount = d3.max(data, d => d.count) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxCount]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px');

    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '11px');

    svg.selectAll()
      .data(data, (d: any) => d.day + ':' + d.hour)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.hour) || 0)
      .attr('y', (d: any) => y(d.day) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d: any) => colorScale(d.count))
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .append('title')
      .text((d: any) => `${d.day} ${d.hour}: ${d.count} RDV`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Heatmap des Rendez-vous (Jour × Heure)');
  }

  // ========== 2. TREEMAP DES REVENUS PAR SPÉCIALITÉ ==========
  private createTreemap(): void {
    const data = this.stats?.data.specialty_stats || [];
    const container = d3.select('#treemap');
    container.selectAll('*').remove();

    const width = 900;
    const height = 400;

    const root = d3.hierarchy({ children: data } as any)
      .sum((d: any) => d.revenue || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap()
      .size([width, height])
      .padding(2)
      (root);

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const colorScale = d3.scaleOrdinal(d3.schemeSet3);

    const cell = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    cell.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .style('fill', (d: any, i: number) => colorScale(i.toString()))
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .append('title')
      .text((d: any) => `${d.data.label}\nMédecins: ${d.data.doctor_count}\nRevenus: ${d.data.revenue} XOF`);

    cell.append('text')
      .attr('x', 5)
      .attr('y', 20)
      .text((d: any) => d.data.label)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333');

    cell.append('text')
      .attr('x', 5)
      .attr('y', 40)
      .text((d: any) => `${d.data.revenue.toLocaleString()} XOF`)
      .style('font-size', '11px')
      .style('fill', '#666');
  }

  // ========== 3. GRAPHIQUE À BARRES (RDV par jour) ==========
  private createBarChart(): void {
    const data = this.stats?.data.appointments_by_day || [];
    const container = d3.select('#bar-chart');
    container.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.date_formatted))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.date_formatted) || 0)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#667eea')
      .append('title')
      .text(d => `${d.date_formatted}: ${d.count} RDV`);
  }

  // ========== 4. FORCE GRAPH (Réseau Patients-Docteurs) ==========
  private createNetworkGraph(): void {
    const networkData = this.stats?.data.network;
    if (!networkData) return;

    const container = d3.select('#network-graph');
    container.selectAll('*').remove();

    const width = 900;
    const height = 600;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter()
      .append('line')
      .style('stroke', '#999')
      .style('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg.append('g')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => 5 + d.appointment_count * 2)
      .style('fill', (d: any) => d.type === 'doctor' ? '#667eea' : '#48bb78')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('title')
      .text((d: any) => `${d.name}\n${d.appointment_count} RDV`);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });
  }

  // ========== 5. SANKEY DIAGRAM (Parcours Patient) ==========
  private createSankeyDiagram(): void {
    const journey = this.stats?.data.patient_journey;
    if (!journey) return;

    const container = d3.select('#sankey');
    container.selectAll('*').remove();

    // Simplifié : affichage en blocs avec flèches
    const width = 900;
    const height = 250;
    const blockWidth = 180;
    const blockHeight = 80;
    const gap = 50;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const steps = [
      { label: 'Nouveaux Patients', value: journey.new_patients, x: 50 },
      { label: '1ère Consultation', value: journey.first_consultation, x: 50 + blockWidth + gap },
      { label: 'Suivi', value: journey.follow_up, x: 50 + (blockWidth + gap) * 2 },
      { label: 'Fidélisés (2+ RDV)', value: journey.loyal_patients, x: 50 + (blockWidth + gap) * 3 }
    ];

    steps.forEach((step, i) => {
      const g = svg.append('g')
        .attr('transform', `translate(${step.x},80)`);

      g.append('rect')
        .attr('width', blockWidth)
        .attr('height', blockHeight)
        .attr('fill', '#667eea')
        .attr('rx', 8);

      g.append('text')
        .attr('x', blockWidth / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(step.label);

      g.append('text')
        .attr('x', blockWidth / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .text(step.value);

      // Flèche
      if (i < steps.length - 1) {
        svg.append('path')
          .attr('d', `M ${step.x + blockWidth + 10} 120 L ${step.x + blockWidth + gap - 10} 120`)
          .attr('stroke', '#667eea')
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .attr('marker-end', 'url(#arrow)');
      }
    });

    // Définir le marqueur de flèche
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#667eea');
  }
}
