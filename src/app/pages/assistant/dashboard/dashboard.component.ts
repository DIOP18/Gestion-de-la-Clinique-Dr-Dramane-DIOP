import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import {AssistantDashboardService, AssistantDashboardStats} from '../../../services/assistant-dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats: AssistantDashboardStats | null = null;
  loading = true;
  downloadingPDF = false;
  autoRefreshInterval: any;

  constructor(private dashboardService: AssistantDashboardService) {}

  ngOnInit(): void {
    this.loadStats();

    // Auto-refresh toutes les 2 minutes
    this.autoRefreshInterval = setInterval(() => {
      this.loadStats(false);
    }, 120000);
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  loadStats(showLoader = true): void {
    if (showLoader) this.loading = true;

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
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

  downloadPDF(): void {
    this.downloadingPDF = true;
    this.dashboardService.downloadPDF().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-assistant-${new Date().toISOString().split('T')[0]}.pdf`;
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

    this.createGanttChart();
    this.createFunnelChart();
    this.createPieCharts();
    this.createPolarChart();
  }

  // ========== 1. GANTT CHART (Agenda des docteurs) ==========
  private createGanttChart(): void {
    const data = this.stats?.data.gantt || [];
    const container = d3.select('#gantt-chart');
    container.selectAll('*').remove();

    if (data.length === 0) {
      container.append('p')
        .style('text-align', 'center')
        .style('color', '#999')
        .style('padding', '50px')
        .text('Aucun rendez-vous pour aujourd\'hui');
      return;
    }

    // Grouper par docteur
    const doctors = Array.from(new Set(data.map(d => d.doctor_name)));

    const margin = { top: 50, right: 150, bottom: 50, left: 200 };
    const width = 1200 - margin.left - margin.right;
    const height = doctors.length * 80 + margin.top + margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Échelle Y (Docteurs)
    const y = d3.scaleBand()
      .range([0, height - margin.top - margin.bottom])
      .domain(doctors)
      .padding(0.2);

    // Échelle X (Temps - 8h à 20h)
    const startHour = 8;
    const endHour = 20;
    const x = d3.scaleTime()
      .domain([
        new Date(2000, 0, 1, startHour, 0),
        new Date(2000, 0, 1, endHour, 0)
      ])
      .range([0, width]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((d: any) => d3.timeFormat('%H:%M')(d)));

    svg.append('g')
      .call(d3.axisLeft(y));

    // Couleurs par statut
    const colorScale: any = {
      'EN ATTENTE': '#fbbf24',
      'CONFIRME': '#3b82f6',
      'COMPLETE': '#10b981',
      'ANNULE': '#ef4444'
    };

    // Barres de rendez-vous
    const appointments = svg.append('g').selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => {
        const debut = new Date(`2000-01-01T${d.heure_debut}`);
        return x(debut);
      })
      .attr('y', (d: any) => y(d.doctor_name) || 0)
      .attr('width', (d: any) => {
        const debut = new Date(`2000-01-01T${d.heure_debut}`);
        const fin = new Date(`2000-01-01T${d.heure_fin}`);
        return x(fin) - x(debut);
      })
      .attr('height', y.bandwidth())
      .attr('fill', (d: any) => colorScale[d.statut] || '#6b7280')
      .attr('rx', 4)
      .style('cursor', 'move')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          d3.select(event.sourceEvent.target).style('opacity', 0.7);
        })
        .on('drag', (event, d) => {
          // Calculer la nouvelle position
          const newX = Math.max(0, Math.min(width, event.x));
          d3.select(event.sourceEvent.target).attr('x', newX);
        })
        .on('end', (event, d) => {
          d3.select(event.sourceEvent.target).style('opacity', 1);
          // Ici vous pouvez appeler l'API pour sauvegarder
          console.log('RDV déplacé:', d);
        }));

    appointments.append('title')
      .text((d: any) => `${d.patient_name}\n${d.heure_debut} - ${d.heure_fin}\n${d.motif}\nStatut: ${d.statut}\nPayé: ${d.est_paye ? 'Oui' : 'Non'}`);

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`);

    Object.entries(colorScale).forEach(([statut, color], i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      g.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', color as string)
        .attr('rx', 3);

      g.append('text')
        .attr('x', 25)
        .attr('y', 14)
        .style('font-size', '12px')
        .text(statut);
    });
  }

  // ========== 2. FUNNEL CHART ==========
  private createFunnelChart(): void {
    const data = this.stats?.data.funnel || [];
    const container = d3.select('#funnel-chart');
    container.selectAll('*').remove();

    const width = 400;
    const height = 300;
    const maxValue = d3.max(data, d => d.value) || 1;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const colors = ['#fbbf24', '#3b82f6', '#10b981'];

    data.forEach((d, i) => {
      const rectWidth = (d.value / maxValue) * 350;
      const rectHeight = 60;
      const x = (width - rectWidth) / 2;
      const y = i * 90 + 20;

      const g = svg.append('g');

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('fill', colors[i])
        .attr('rx', 6);

      g.append('text')
        .attr('x', width / 2)
        .attr('y', y + 25)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(d.label);

      g.append('text')
        .attr('x', width / 2)
        .attr('y', y + 45)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(d.value);
    });
  }

  // ========== 3. PIE CHARTS (Payés vs Non payés + Statuts) ==========
  private createPieCharts(): void {
    this.createPieChart('#payment-pie', this.stats?.data.payment_stats || [], ['#10b981', '#ef4444']);
    this.createPieChart('#status-pie', this.stats?.data.status_stats || [], d3.schemeSet2);
  }

  private createPieChart(selector: string, data: any[], colors: any): void {
    const container = d3.select(selector);
    container.selectAll('*').remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<any>().value((d: any) => d.value);
    const arc: any = d3.arc().innerRadius(0).outerRadius(radius - 20);

    const colorScale = d3.scaleOrdinal(colors);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d: any, i: number) => colorScale(String(i)) as string)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .append('title')
      .text((d: any) => `${d.data.label}: ${d.data.value}`);


    arcs.append('text')
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text((d: any) => d.data.value);
  }

  // ========== 4. POLAR CHART (Motifs) ==========
  private createPolarChart(): void {
    const data = this.stats?.data.motives_stats || [];
    const container = d3.select('#polar-chart');
    container.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const angleScale = d3.scaleLinear()
      .domain([0, data.length])
      .range([0, 2 * Math.PI]);

    const maxValue = d3.max(data, d => d.value) || 1;
    const radiusScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Grilles circulaires
    [0.25, 0.5, 0.75, 1].forEach(factor => {
      svg.append('circle')
        .attr('r', radius * factor)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-dasharray', '2,2');
    });

    // Barres radiales
    data.forEach((d: any, i: number) => {
      const angle = angleScale(i) - Math.PI / 2;
      const barRadius = radiusScale(d.value);

      // Corrige TypeScript : typage explicite
      const arcGenerator: d3.Arc<any, d3.DefaultArcObject> = d3.arc()
        .innerRadius(0)
        .outerRadius(barRadius)
        .startAngle(angle - 0.15)
        .endAngle(angle + 0.15);

      svg.append('path')
        .attr('d', (arcGenerator as any)())
        .attr('fill', () => colorScale(String(i)))
        .append('title')
        .text(`${d.label}: ${d.value}`);

      // Labels
      const labelRadius = radius + 20;
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;

      svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .text(d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label);
    });
  }
}
