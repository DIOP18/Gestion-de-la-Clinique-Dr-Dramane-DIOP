import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { DashboardAdminService, DashboardStats } from '../../../services/dashboard.admin.service';
import { FormsModule } from '@angular/forms';

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
  selectedSpecialty = 'all';
  selectedPaymentStatus = 'all';
  downloadingPDF = false;

  filterOptions = [
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
    { value: '365', label: '1 an' }
  ];

  specialties: string[] = [];

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
        // Extraire les spécialités
        this.specialties = ['all', ...data.data.specialty_stats.map(s => s.label)];
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

  onFilterChange(): void {
    this.loadStats();
  }

  onSpecialtyChange(): void {
    this.createAllCharts();
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
    this.createAppointmentsByDayChart();
    this.createAppointmentsBySpecialtyChart();
    this.createRevenueBySpecialtyChart();
  }

  // ========== GRAPHIQUE: Rendez-vous par jour ==========
  private createAppointmentsByDayChart(): void {
    const data = this.stats?.data.appointments_by_day || [];
    const container = d3.select('#appointments-by-day');
    container.selectAll('*').remove();

    if (data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 70, left: 60 };
    const containerWidth = (container.node() as HTMLElement)?.clientWidth || 800;
    const width = Math.min(containerWidth, 900) - margin.left - margin.right;
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

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px')
      .style('font-weight', '600');

    svg.append('g')
      .call(d3.axisLeft(y))
      .style('font-size', '11px')
      .style('font-weight', '600');

    // Barres
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.date_formatted) || 0)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
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
      .text(d => `${d.date_formatted}\n${d.count} rendez-vous`);
  }

  // ========== GRAPHIQUE: Rendez-vous par spécialité ==========
  private createAppointmentsBySpecialtyChart(): void {
    let data = this.stats?.data.specialty_stats || [];
    const container = d3.select('#appointments-by-specialty');
    container.selectAll('*').remove();

    // Filtrer par spécialité si nécessaire
    if (this.selectedSpecialty !== 'all') {
      data = data.filter(d => d.label === this.selectedSpecialty);
    }

    if (data.length === 0) {
      container.append('p')
        .style('text-align', 'center')
        .style('color', '#6b7280')
        .style('padding', '40px')
        .text('Aucune donnée disponible');
      return;
    }

    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const containerWidth = (container.node() as HTMLElement)?.clientWidth || 800;
    const width = Math.min(containerWidth, 800) - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.label))
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total_appointments) || 0])
      .range([height, 0]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '600');

    svg.append('g')
      .call(d3.axisLeft(y))
      .style('font-size', '11px')
      .style('font-weight', '600');

    // Barres
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label) || 0)
      .attr('y', d => y(d.total_appointments))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.total_appointments))
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
      .text(d => `${d.label}\n${d.total_appointments} rendez-vous\n${d.doctor_count} médecin(s)`);

    // Valeurs au-dessus des barres
    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.total_appointments) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '700')
      .style('fill', '#1565c0')
      .text(d => d.total_appointments);
  }

  // ========== GRAPHIQUE: Revenus par spécialité (Donut Chart) ==========
  private createRevenueBySpecialtyChart(): void {
    let data = this.stats?.data.specialty_stats || [];
    const container = d3.select('#revenue-by-specialty');
    container.selectAll('*').remove();

    // Filtrer par spécialité si nécessaire
    if (this.selectedSpecialty !== 'all') {
      data = data.filter(d => d.label === this.selectedSpecialty);
    }

    // Filtrer uniquement les spécialités avec des revenus
    data = data.filter(d => d.revenue > 0);

    if (data.length === 0) {
      container.append('p')
        .style('text-align', 'center')
        .style('color', '#6b7280')
        .style('padding', '40px')
        .text('Aucune donnée disponible');
      return;
    }

    const containerWidth = (container.node() as HTMLElement)?.clientWidth || 400;
    const width = Math.min(containerWidth, 400);
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(['#1565c0', '#1a237e', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b']);

    const pie = d3.pie<any>()
      .value(d => d.revenue)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const arcHover = d3.arc<any>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius + 10);

    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .style('cursor', 'pointer')
      .style('stroke', '#fff')
      .style('stroke-width', '2px')
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
      .text(d => `${d.data.label}\n${d.data.revenue.toLocaleString()} FCFA\n${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%`);

    // Labels avec pourcentage
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', 'white')
      .text(d => {
        const percent = ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100;
        return percent > 5 ? `${percent.toFixed(0)}%` : '';
      });

    // Légende
    const legend = svg.append('g')
      .attr('transform', `translate(${radius + 20}, ${-radius})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('rx', 3)
      .attr('fill', d => color(d.label));

    legendItems.append('text')
      .attr('x', 24)
      .attr('y', 14)
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(d => d.label);
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'EN ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'COMPLETE': 'Complété',
      'ANNULE': 'Annulé',
      'REPORT': 'Reporté'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'EN ATTENTE': 'status-pending',
      'CONFIRME': 'status-confirmed',
      'COMPLETE': 'status-completed',
      'ANNULE': 'status-cancelled',
      'REPORT': 'status-rescheduled'
    };
    return classes[status] || '';
  }
}
