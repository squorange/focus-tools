"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { TaskFilters, Project } from "@/lib/types";
import { BottomSheet, RightDrawer, CollapsibleSection } from "@design-system/components";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  projects: Project[];
  matchCount: number;
}

// Preset definitions with array values for multi-select support
const FILTER_PRESETS = [
  {
    id: 'urgent',
    label: 'Urgent',
    icon: '🔥',
    filters: {
      dueDateRange: ['overdue', 'today'] as ('overdue' | 'today')[],
      healthStatus: ['critical', 'at_risk'] as ('critical' | 'at_risk')[],
    }
  },
  {
    id: 'quick_wins',
    label: 'Quick wins',
    icon: '⚡',
    filters: {
      durationRange: ['quick', 'short'] as ('quick' | 'short')[],
    }
  },
  {
    id: 'needs_attention',
    label: 'Needs attention',
    icon: '⚠️',
    filters: {
      healthStatus: ['critical', 'at_risk'] as ('critical' | 'at_risk')[],
    }
  },
  {
    id: 'due_soon',
    label: 'Due soon',
    icon: '📅',
    filters: {
      dueDateRange: ['today', 'this_week'] as ('today' | 'this_week')[],
    }
  },
];

// Filter option configs
const DUE_DATE_OPTIONS = [
  { value: 'overdue' as const, label: 'Overdue' },
  { value: 'today' as const, label: 'Today' },
  { value: 'this_week' as const, label: 'This week' },
  { value: 'next_week' as const, label: 'Next week' },
  { value: 'later' as const, label: 'Later' },
  { value: 'none' as const, label: 'None' },
];

const TARGET_DATE_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: 'this_week' as const, label: 'This week' },
  { value: 'next_week' as const, label: 'Next week' },
  { value: 'later' as const, label: 'Later' },
  { value: 'none' as const, label: 'None' },
];

const CREATED_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: 'this_week' as const, label: 'This week' },
  { value: 'this_month' as const, label: 'This month' },
  { value: 'older' as const, label: 'Older' },
];

const DURATION_OPTIONS = [
  { value: 'quick' as const, label: '<15m' },
  { value: 'short' as const, label: '15-30m' },
  { value: 'medium' as const, label: '30m-1h' },
  { value: 'long' as const, label: '1-2h' },
  { value: 'deep' as const, label: '2h+' },
  { value: 'none' as const, label: 'None' },
];

const PRIORITY_OPTIONS = [
  { value: 'high' as const, label: 'High' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'low' as const, label: 'Low' },
  { value: 'none' as const, label: 'None' },
];

const HEALTH_OPTIONS = [
  { value: 'critical' as const, label: 'Critical' },
  { value: 'at_risk' as const, label: 'At Risk' },
];

const STALENESS_OPTIONS = [
  { value: '7_days' as const, label: '7+ days' },
  { value: '14_days' as const, label: '14+ days' },
  { value: '30_days' as const, label: '30+ days' },
];

const DEFER_COUNT_OPTIONS = [
  { value: 'never' as const, label: 'Never' },
  { value: '1x' as const, label: '1x' },
  { value: '2_3x' as const, label: '2-3x' },
  { value: '4_plus' as const, label: '4+' },
];

// Multi-select pills component - all filters now use this
interface MultiSelectPillsProps<T extends string> {
  options: { value: T; label: string }[];
  values: T[];
  onChange: (values: T[]) => void;
}

function MultiSelectPills<T extends string>({
  options,
  values,
  onChange,
}: MultiSelectPillsProps<T>) {
  const toggleValue = (value: T) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <button
            key={option.value}
            onClick={() => toggleValue(option.value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              isSelected
                ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                : 'bg-zinc-50 dark:bg-zinc-800 border-border-color-neutral text-fg-neutral-secondary hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}


// Check if two arrays have the same elements (order-independent)
function arraysEqual<T>(a: T[] | undefined, b: T[] | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

// Check if current filters exactly match a preset
function checkPresetMatch(filters: TaskFilters, presetFilters: Partial<TaskFilters>): boolean {
  // Get all filter keys that could be in a preset
  const allFilterKeys = ['dueDateRange', 'targetDateRange', 'createdRange', 'durationRange',
    'projectId', 'priority', 'healthStatus', 'stalenessRange', 'deferCount'] as const;

  for (const key of allFilterKeys) {
    const presetValue = presetFilters[key];
    const filterValue = filters[key];

    if (presetValue !== undefined) {
      // Preset has this filter - must match
      if (!arraysEqual(presetValue as string[], filterValue as string[])) {
        return false;
      }
    } else {
      // Preset doesn't have this filter - current filters must not have it either (or be empty)
      if (filterValue && Array.isArray(filterValue) && filterValue.length > 0) {
        return false;
      }
    }
  }

  return true;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  projects,
  matchCount,
}: FilterDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>({});

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Smart defaults: expand sections with active filters on drawer open
  useEffect(() => {
    if (isOpen) {
      const expanded: Record<string, boolean> = {};
      if (filters.dueDateRange?.length) expanded.dueDate = true;
      if (filters.targetDateRange?.length) expanded.targetDate = true;
      if (filters.createdRange?.length) expanded.created = true;
      if (filters.priority?.length) expanded.priority = true;
      if (filters.healthStatus?.length) expanded.health = true;
      if (filters.stalenessRange?.length) expanded.staleness = true;
      if (filters.deferCount?.length) expanded.deferCount = true;
      if (filters.durationRange?.length) expanded.duration = true;
      if (filters.projectId?.length) expanded.project = true;
      setSectionExpanded(expanded);
    }
  }, [isOpen, filters]);

  const clearAllFilters = () => {
    onFiltersChange({});
    // Collapse all sections when clearing
    setSectionExpanded({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0 &&
    Object.values(filters).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  const toggleSection = (section: string) => {
    setSectionExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Find the active preset (if any) based on exact match
  const getActivePresetId = (): string | null => {
    for (const preset of FILTER_PRESETS) {
      if (checkPresetMatch(filters, preset.filters)) {
        return preset.id;
      }
    }
    return null;
  };

  const activePreset = getActivePresetId();

  const handlePresetClick = (preset: typeof FILTER_PRESETS[0]) => {
    // Clicking a preset replaces all filters with preset's filters
    onFiltersChange(preset.filters as TaskFilters);
    // Auto-expand relevant sections
    const newExpanded: Record<string, boolean> = {};
    if (preset.filters.dueDateRange) newExpanded.dueDate = true;
    if (preset.filters.healthStatus) newExpanded.health = true;
    if (preset.filters.durationRange) newExpanded.duration = true;
    setSectionExpanded(newExpanded);
  };

  // Count active filters per section
  const countActiveDueDate = filters.dueDateRange?.length || 0;
  const countActiveTargetDate = filters.targetDateRange?.length || 0;
  const countActiveCreated = filters.createdRange?.length || 0;
  const countActivePriority = filters.priority?.length || 0;
  const countActiveHealth = filters.healthStatus?.length || 0;
  const countActiveStaleness = filters.stalenessRange?.length || 0;
  const countActiveDeferCount = filters.deferCount?.length || 0;
  const countActiveDuration = filters.durationRange?.length || 0;
  const countActiveProject = filters.projectId?.length || 0;

  // Shared content renderer
  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header - h-14 matches standard */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0">
        <h2 className="text-base font-medium text-fg-neutral-primary">Filters</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-bg-neutral-subtle rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Quick filters (presets) */}
        <div>
          <h3 className="text-xs font-medium text-fg-neutral-secondary uppercase tracking-wider mb-2">
            Quick filters
          </h3>
          <div className="flex flex-wrap gap-2">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  activePreset === preset.id
                    ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-border-color-neutral text-fg-neutral-secondary hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {preset.icon} {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800" />

        {/* DATES group */}
        <div>
          <h3 className="text-xs font-medium text-fg-neutral-secondary uppercase tracking-wider mb-2">
            Dates
          </h3>

          <CollapsibleSection
            title="Due Date"
            expanded={sectionExpanded.dueDate ?? false}
            onToggle={() => toggleSection('dueDate')}
            activeCount={countActiveDueDate}
          >
            <MultiSelectPills
              options={DUE_DATE_OPTIONS}
              values={filters.dueDateRange || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                dueDateRange: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Target Date"
            expanded={sectionExpanded.targetDate ?? false}
            onToggle={() => toggleSection('targetDate')}
            activeCount={countActiveTargetDate}
          >
            <MultiSelectPills
              options={TARGET_DATE_OPTIONS}
              values={filters.targetDateRange || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                targetDateRange: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Created"
            expanded={sectionExpanded.created ?? false}
            onToggle={() => toggleSection('created')}
            activeCount={countActiveCreated}
          >
            <MultiSelectPills
              options={CREATED_OPTIONS}
              values={filters.createdRange || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                createdRange: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800" />

        {/* STATUS group */}
        <div>
          <h3 className="text-xs font-medium text-fg-neutral-secondary uppercase tracking-wider mb-2">
            Status
          </h3>

          <CollapsibleSection
            title="Priority"
            expanded={sectionExpanded.priority ?? false}
            onToggle={() => toggleSection('priority')}
            activeCount={countActivePriority}
          >
            <MultiSelectPills
              options={PRIORITY_OPTIONS}
              values={filters.priority || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                priority: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Health"
            expanded={sectionExpanded.health ?? false}
            onToggle={() => toggleSection('health')}
            activeCount={countActiveHealth}
          >
            <MultiSelectPills
              options={HEALTH_OPTIONS}
              values={filters.healthStatus || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                healthStatus: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Staleness"
            expanded={sectionExpanded.staleness ?? false}
            onToggle={() => toggleSection('staleness')}
            activeCount={countActiveStaleness}
          >
            <MultiSelectPills
              options={STALENESS_OPTIONS}
              values={filters.stalenessRange || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                stalenessRange: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Defer Count"
            expanded={sectionExpanded.deferCount ?? false}
            onToggle={() => toggleSection('deferCount')}
            activeCount={countActiveDeferCount}
          >
            <MultiSelectPills
              options={DEFER_COUNT_OPTIONS}
              values={filters.deferCount || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                deferCount: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800" />

        {/* OTHER group */}
        <div>
          <h3 className="text-xs font-medium text-fg-neutral-secondary uppercase tracking-wider mb-2">
            Other
          </h3>

          <CollapsibleSection
            title="Duration"
            expanded={sectionExpanded.duration ?? false}
            onToggle={() => toggleSection('duration')}
            activeCount={countActiveDuration}
          >
            <MultiSelectPills
              options={DURATION_OPTIONS}
              values={filters.durationRange || []}
              onChange={(values) => onFiltersChange({
                ...filters,
                durationRange: values.length > 0 ? values : undefined,
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Project"
            expanded={sectionExpanded.project ?? false}
            onToggle={() => toggleSection('project')}
            activeCount={countActiveProject}
          >
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="No project"
                selected={filters.projectId?.includes('none') ?? false}
                onClick={() => {
                  const current = filters.projectId || [];
                  const updated = current.includes('none')
                    ? current.filter(v => v !== 'none')
                    : [...current, 'none'];
                  onFiltersChange({
                    ...filters,
                    projectId: updated.length > 0 ? updated : undefined,
                  });
                }}
              />
              {projects.filter(p => p.status === 'active').map((project) => (
                <FilterChip
                  key={project.id}
                  label={project.name}
                  selected={filters.projectId?.includes(project.id) ?? false}
                  onClick={() => {
                    const current = filters.projectId || [];
                    const updated = current.includes(project.id)
                      ? current.filter(v => v !== project.id)
                      : [...current, project.id];
                    onFiltersChange({
                      ...filters,
                      projectId: updated.length > 0 ? updated : undefined,
                    });
                  }}
                  color={project.color || undefined}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Footer with count and actions */}
      <div
        className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-neutral-secondary">
            {matchCount} {matchCount === 1 ? 'task' : 'tasks'}
          </span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 hover:bg-bg-neutral-subtle-hover text-fg-neutral-primary rounded-lg transition-colors"
              >
                Clear all
              </button>
            )}
            {/* Done button - mobile only (desktop can use X or click outside) */}
            {isMobile && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        height="85vh"
        zIndex={60}
      >
        {renderContent()}
      </BottomSheet>
    );
  }

  // Desktop/Tablet: Use RightDrawer component
  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="360px"
      zIndex={40}
      showBackdrop={false}
    >
      {renderContent()}
    </RightDrawer>
  );
}

// Filter chip component
interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}

function FilterChip({ label, selected, onClick, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
        selected
          ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
          : 'bg-zinc-50 dark:bg-zinc-800 border-border-color-neutral text-fg-neutral-secondary hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
      style={color && selected ? { borderColor: color, backgroundColor: `${color}20` } : undefined}
    >
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}
