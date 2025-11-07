import { NextRequest, NextResponse } from 'next/server';

/**
 * Tasks API Routes
 *
 * GET /api/tasks - Get all tasks
 * POST /api/tasks - Create a new task
 * PUT /api/tasks - Update a task
 * DELETE /api/tasks?id=<taskId> - Delete a task
 */

// In-memory storage for demo (in production, this would use a database)
let tasks = [
  {
    id: '1',
    title: 'Call dentist',
    description: 'Schedule 6-month checkup',
    priority: 'urgent',
    category: 'personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orbitDistance: 1,
    completed: false,
    subtasks: [
      { id: '1-1', title: 'Find dentist number', completed: false, parentTaskId: '1' },
      { id: '1-2', title: 'Check insurance', completed: false, parentTaskId: '1' },
      { id: '1-3', title: 'Schedule time off', completed: false, parentTaskId: '1' },
      { id: '1-4', title: 'Prepare questions', completed: false, parentTaskId: '1' },
    ],
  },
  {
    id: '2',
    title: 'Review Q3 budget',
    description: 'Analyze spending and prepare report',
    priority: 'high',
    category: 'work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orbitDistance: 2,
    completed: false,
    subtasks: [
      { id: '2-1', title: 'Download reports', completed: false, parentTaskId: '2' },
      { id: '2-2', title: 'Analyze variances', completed: false, parentTaskId: '2' },
      { id: '2-3', title: 'Draft summary', completed: false, parentTaskId: '2' },
      { id: '2-4', title: 'Schedule review meeting', completed: false, parentTaskId: '2' },
    ],
  },
  {
    id: '3',
    title: 'Buy birthday gift',
    description: "Mom's birthday next week",
    priority: 'medium',
    category: 'personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orbitDistance: 3,
    completed: false,
    subtasks: [
      { id: '3-1', title: 'Brainstorm gift ideas', completed: false, parentTaskId: '3' },
      { id: '3-2', title: 'Check budget', completed: false, parentTaskId: '3' },
      { id: '3-3', title: 'Order or purchase', completed: false, parentTaskId: '3' },
    ],
  },
  {
    id: '4',
    title: 'Fix leaky faucet',
    description: 'Kitchen sink dripping',
    priority: 'medium',
    category: 'home',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orbitDistance: 3,
    completed: false,
    subtasks: [
      { id: '4-1', title: 'Buy replacement parts', completed: false, parentTaskId: '4' },
      { id: '4-2', title: 'Watch repair tutorial', completed: false, parentTaskId: '4' },
      { id: '4-3', title: 'Fix the faucet', completed: false, parentTaskId: '4' },
    ],
  },
  {
    id: '5',
    title: 'Schedule car service',
    description: 'Oil change and tire rotation',
    priority: 'low',
    category: 'maintenance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orbitDistance: 4,
    completed: false,
    subtasks: [
      { id: '5-1', title: 'Find service center', completed: false, parentTaskId: '5' },
      { id: '5-2', title: 'Book appointment', completed: false, parentTaskId: '5' },
    ],
  },
];

export async function GET() {
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newTask = {
    ...body,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  return NextResponse.json({ task: newTask }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const index = tasks.findIndex((t) => t.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  tasks[index] = { ...tasks[index], ...body, updatedAt: new Date().toISOString() };
  return NextResponse.json({ task: tasks[index] });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }
  tasks = tasks.filter((t) => t.id !== id);
  return NextResponse.json({ success: true });
}
