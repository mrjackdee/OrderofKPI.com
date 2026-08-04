import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
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
  { id: '1', name: 'Strategic Planning', start: new Date(2026, 7, 1), end: new Date(2026, 7, 15), category: 'Preparation', progress: 100 },
  { id: '2', name: 'Resource Development', start: new Date(2026, 7, 10), end: new Date(2026, 7, 30), category: 'Preparation', progress: 80 },
  { id: '3', name: 'Interest Meetings', start: new Date(2026, 8, 1), end: new Date(2026, 8, 20), category: 'Marketing', progress: 40 },
  { id: '4', name: 'Social Media Campaign', start: new Date(2026, 8, 1), end: new Date(2026, 9, 15), category: 'Marketing', progress: 20 },
  { id: '5', name: 'Application Window', start: new Date(2026, 9, 15), end: new Date(2026, 10, 15), category: 'Application', progress: 0 },
  { id: '6', name: 'Dossier Review', start: new Date(2026, 10, 1), end: new Date(2026, 10, 30), category: 'Application', progress: 0 },
  { id: '7', name: 'Tea Time Events', start: new Date(2026, 11, 1), end: new Date(2026, 11, 15), category: 'Interviews', progress: 0 },
  { id: '8', name: 'Formal Interviews', start: new Date(2026, 11, 10), end: new Date(2026, 11, 25), category: 'Interviews', progress: 0 },
  { id: '9', name: 'Selection Voting', start: new Date(2027, 0, 5), end: new Date(2027, 0, 15), category: 'Selection', progress: 0 },
  { id: '10', name: 'Intake Orientation', start: new Date(2027, 0, 20), end: new Date(2027, 1, 10), category: 'Intake', progress: 0 }
];

export default function GanttChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

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

    const margin = { top: 40, right: 40, bottom: 40, left: 200 };
    const width = Math.max(containerRef.current.clientWidth - margin.left - margin.right, 800);
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
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#1E3F20');

    // Task Bars
    const taskGroups = svg.selectAll('.task')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task');

    taskGroups.append('rect')
      .attr('x', t => x(t.start))
      .attr('y', t => y(t.name) as number)
      .attr('width', t => x(t.end) - x(t.start))
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
      .attr('width', t => (x(t.end) - x(t.start)) * (t.progress / 100))
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
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-ivy py-16 px-4 mb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-display text-cream mb-4">Process Timeline</h1>
            <p className="text-cream/70 font-body max-w-2xl">
              FY27 Membership Intake Process (MIP) Strategic Roadmap. Visualizing every milestone from preparation to orientation.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
              className="bg-cream/10 hover:bg-cream/20 text-cream p-3 rounded-md transition-all"
            >
              {viewMode === 'chart' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            <button className="bg-gold text-ivy px-6 py-3 rounded-md font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-lg">
              <Download className="w-4 h-4" /> Export Roadmap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {viewMode === 'chart' ? (
          <div className="bg-white p-8 rounded-lg border border-gold/20 shadow-soft overflow-x-auto" ref={containerRef}>
            <div className="min-w-[1000px]">
              <svg ref={svgRef}></svg>
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
