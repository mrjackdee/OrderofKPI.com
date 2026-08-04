import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  LayoutGrid,
  List,
  Download
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  category: 'Preparation' | 'Marketing' | 'Application' | 'Interviews' | 'Selection' | 'Intake';
  progress: number;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Interest Meetings (#1 & #2)', start: new Date(2026, 7, 2), end: new Date(2026, 7, 3), category: 'Marketing', progress: 100 },
  { id: '2', name: 'Candidate Applications', start: new Date(2026, 7, 2), end: new Date(2026, 7, 5), category: 'Application', progress: 80 },
  { id: '3', name: 'Application Scoring', start: new Date(2026, 7, 6), end: new Date(2026, 7, 8), category: 'Application', progress: 50 },
  { id: '4', name: 'Notifications & Tea Time Invites', start: new Date(2026, 7, 10), end: new Date(2026, 7, 10), category: 'Application', progress: 0 },
  { id: '5', name: 'Tea Time Period & Zoom Call', start: new Date(2026, 7, 12), end: new Date(2026, 7, 16), category: 'Interviews', progress: 0 },
  { id: '6', name: 'Candidate Interviews', start: new Date(2026, 7, 19), end: new Date(2026, 7, 24), category: 'Interviews', progress: 0 },
  { id: '7', name: 'Interview Video Review', start: new Date(2026, 7, 25), end: new Date(2026, 7, 28), category: 'Interviews', progress: 0 },
  { id: '8', name: 'MIP Voting Period', start: new Date(2026, 7, 31), end: new Date(2026, 8, 2), category: 'Selection', progress: 0 },
  { id: '9', name: 'Candidate Notifications & No Contact', start: new Date(2026, 8, 4), end: new Date(2026, 8, 7), category: 'Selection', progress: 0 },
  { id: '10', name: 'First Initiation Payment Due', start: new Date(2026, 8, 11), end: new Date(2026, 8, 11), category: 'Intake', progress: 0 }
];

export default function GanttChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  const exportRoadmap = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions
    const COLOR_IVY = [30, 63, 32];     // #1E3F20
    const COLOR_GOLD = [184, 134, 11];  // #B8860B
    const COLOR_CREAM = [253, 252, 240]; // #FDFCF0
    const COLOR_GRAY_TEXT = [100, 100, 100];
    const COLOR_DARK_TEXT = [30, 63, 32];

    // Header Background
    doc.setFillColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ORDER OF KPI', 105, 14, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text('FY27 Membership Intake Process (MIP) Strategic Roadmap', 105, 21, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated on ${dateStr} | Confidential Internal Document`, 105, 28, { align: 'center' });

    // Decorative Gold Line below header
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(0, 40, 210, 1.5, 'F');

    let y = 55;

    // Introduction text
    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MIP Timeline & Milestones', 14, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_GRAY_TEXT[0], COLOR_GRAY_TEXT[1], COLOR_GRAY_TEXT[2]);
    doc.text('This document outlines the sequential phases and key deliverables of the FY27 Intake process.', 14, y);
    y += 10;

    // Draw Column Headers
    doc.setFillColor(245, 243, 230); // light warm background
    doc.rect(14, y - 4, 182, 7, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
    doc.text('TASK / MILESTONE', 16, y);
    doc.text('PHASE', 90, y);
    doc.text('TIMELINE', 115, y);
    doc.text('PROGRESS', 162, y);
    
    y += 8;

    // Draw each task
    tasks.forEach((task) => {
      // Check page overflow
      if (y > 270) {
        doc.addPage();
        // Repeating Header for new pages
        doc.setFillColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('ORDER OF KPI - FY27 MIP Strategic Roadmap', 14, 12);
        
        doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.rect(0, 20, 210, 1, 'F');

        y = 32;
        
        // Redraw column headers on new page
        doc.setFillColor(245, 243, 230);
        doc.rect(14, y - 4, 182, 7, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
        doc.text('TASK / MILESTONE', 16, y);
        doc.text('PHASE', 90, y);
        doc.text('TIMELINE', 115, y);
        doc.text('PROGRESS', 162, y);
        y += 8;
      }

      // Draw subtle row divider
      doc.setDrawColor(240, 238, 220);
      doc.setLineWidth(0.15);
      doc.line(14, y + 4.5, 196, y + 4.5);

      // Task Name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
      const nameLines = doc.splitTextToSize(task.name, 70);
      nameLines.forEach((line: string, lineIdx: number) => {
        doc.text(line, 16, y + (lineIdx * 3.5));
      });

      // Category / Phase Badge
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.text(task.category, 90, y);

      // Timeline Dates & Duration
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_GRAY_TEXT[0], COLOR_GRAY_TEXT[1], COLOR_GRAY_TEXT[2]);
      const dateString = `${task.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${task.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      doc.text(dateString, 115, y);
      
      const durationDays = Math.round((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      doc.setFontSize(7);
      doc.setTextColor(COLOR_GRAY_TEXT[0] + 30, COLOR_GRAY_TEXT[1] + 30, COLOR_GRAY_TEXT[2] + 30);
      doc.text(`(${durationDays} day${durationDays > 1 ? 's' : ''})`, 115, y + 3.2);

      // Progress bar and Percentage text
      // Track
      doc.setFillColor(242, 240, 225);
      doc.rect(162, y - 1.5, 20, 2, 'F');
      
      // Fill
      if (task.progress > 0) {
        doc.setFillColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
        doc.rect(162, y - 1.5, 20 * (task.progress / 100), 2, 'F');
      }

      // Percentage text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_IVY[0], COLOR_IVY[1], COLOR_IVY[2]);
      doc.text(`${task.progress}%`, 185, y + 0.2);

      const maxRowHeight = Math.max(nameLines.length * 3.5, 6);
      y += maxRowHeight + 3.5;
    });

    // Add Footer page numbers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
      doc.text('Order of KPI © 2026', 14, 287);
    }

    // Save PDF
    doc.save('FY27_MIP_Strategic_Roadmap.pdf');
  };

  useEffect(() => {
    if (viewMode === 'chart') {
      renderChart();
    }
    
    const handleResize = () => {
      if (viewMode === 'chart') renderChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tasks, viewMode]);

  const renderChart = () => {
    if (!svgRef.current || !containerRef.current) return;

    const isMobile = window.innerWidth < 640;
    const margin = { 
      top: 40, 
      right: isMobile ? 15 : 40, 
      bottom: 40, 
      left: isMobile ? 130 : 200 
    };
    
    // We compute the available width and ensure it doesn't get ridiculously squeezed on small screens.
    // By enforcing a comfortable minimum width (550px on mobile, 800px on desktop), we preserve legibility.
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const width = Math.max(containerWidth - margin.left - margin.right, isMobile ? 550 : 800);
    const height = tasks.length * 50;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain([
        d3.min(tasks, t => t.start) as Date,
        d3.max(tasks, t => t.end) as Date
      ])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(tasks.map(t => t.name))
      .range([0, height])
      .padding(0.4);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .style('stroke', '#1E3F2010');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat('%b %Y') as any))
      .selectAll('text')
      .style('font-family', 'Plus Jakarta Sans')
      .style('font-size', '10px')
      .style('fill', '#1E3F2040');

    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-family', 'Plus Jakarta Sans')
      .style('font-size', isMobile ? '10px' : '12px')
      .style('font-weight', '600')
      .style('fill', '#1E3F20')
      .each(function() {
        const textElement = d3.select(this);
        const text = textElement.text();
        if (isMobile && text.length > 20) {
          textElement.text(text.substring(0, 18) + '...');
        }
      });

    // Task Bars
    const taskGroups = svg.selectAll('.task')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task');

    taskGroups.append('rect')
      .attr('x', t => x(t.start))
      .attr('y', t => y(t.name) as number)
      .attr('width', t => Math.max(x(t.end) - x(t.start), 5)) // Ensure a minimum readable bar width
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', t => {
        switch(t.category) {
          case 'Preparation': return '#1E3F20';
          case 'Marketing': return '#B8860B';
          case 'Application': return '#4A6741';
          case 'Interviews': return '#8B6B1D';
          case 'Selection': return '#2C4C2E';
          case 'Intake': return '#D4AF37';
          default: return '#ccc';
        }
      })
      .style('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function() { d3.select(this).style('opacity', 1); })
      .on('mouseout', function() { d3.select(this).style('opacity', 0.8); });

    // Progress overlay
    taskGroups.append('rect')
      .attr('x', t => x(t.start))
      .attr('y', t => y(t.name) as number)
      .attr('width', t => Math.max(x(t.end) - x(t.start), 5) * (t.progress / 100))
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', '#000')
      .style('opacity', 0.2)
      .style('pointer-events', 'none');

    // Date Labels
    taskGroups.append('text')
      .attr('x', t => x(t.end) + 10)
      .attr('y', t => (y(t.name) as number) + y.bandwidth() / 2)
      .attr('dy', '.35em')
      .text(t => `${t.progress}%`)
      .style('font-size', '10px')
      .style('fill', '#1E3F2040')
      .style('font-weight', '700');
  };

  return (
    <div className="min-h-screen bg-cream pb-20 w-full overflow-x-hidden">
      <div className="bg-ivy py-16 px-4 mb-12 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="w-full md:w-auto">
            <h1 className="text-4xl md:text-5xl font-display text-cream mb-4 break-words">Process Timeline</h1>
            <p className="text-cream/70 font-body max-w-2xl break-words">
              FY27 Membership Intake Process (MIP) Strategic Roadmap. Visualizing every milestone from preparation to orientation.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto justify-start md:justify-end">
            <button 
              onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
              className="bg-cream/10 hover:bg-cream/20 text-cream p-3 rounded-md transition-all flex items-center justify-center"
            >
              {viewMode === 'chart' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            <button 
              onClick={exportRoadmap}
              className="bg-gold text-ivy px-6 py-3 rounded-md font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-lg whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Export Roadmap
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 overflow-hidden">
        {viewMode === 'chart' ? (
          <div className="w-full max-w-full bg-white p-4 sm:p-8 rounded-lg border border-gold/20 shadow-soft overflow-x-auto" ref={containerRef}>
            <div className="sm:hidden text-center text-xs text-ivy/50 mb-4 flex items-center justify-center gap-1.5">
              <span>← Swipe horizontally to explore timeline →</span>
            </div>
            <div className="w-full overflow-x-auto">
              <svg ref={svgRef} className="max-w-none block"></svg>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-8 pt-8 border-t border-cream">
              {[
                { label: 'Preparation', color: 'bg-ivy' },
                { label: 'Marketing', color: 'bg-gold' },
                { label: 'Application', color: 'bg-[#4A6741]' },
                { label: 'Interviews', color: 'bg-[#8B6B1D]' },
                { label: 'Selection', color: 'bg-[#2C4C2E]' },
                { label: 'Intake', color: 'bg-[#D4AF37]' }
              ].map(cat => (
                <div key={cat.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${cat.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/60">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg border border-gold/20 shadow-soft"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-display text-ivy">{task.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-cream text-gold rounded">
                    {task.category}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-ivy/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-ivy/60 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {Math.round((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))} Days</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-ivy/40">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-ivy transition-all duration-1000" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
