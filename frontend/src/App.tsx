import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Checkbox } from './components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Calendar } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Edit, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { 
  fetchTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  fetchCategories, 
  createCategory,
  Task as TaskType,
  CreateTaskDto
} from './services/api';

function App() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newTask, setNewTask] = useState<Omit<CreateTaskDto, 'id'>>({
    title: '',
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: null,
    category: 'personal'
  });
  
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['personal', 'work', 'shopping', 'other']);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Fetch tasks and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tasksData, categoriesData] = await Promise.all([
          fetchTasks(),
          fetchCategories()
        ]);
        
        setTasks(tasksData);
        
        // If we have categories from the API, use them, otherwise use defaults
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  // Filter tasks based on active tab and search query
  const filteredTasks = tasks.filter(task => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'completed' && task.completed) || 
      (activeTab === 'active' && !task.completed) ||
      (activeTab === 'high-priority' && task.priority === 'high') ||
      (activeTab === task.category);
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Add a new task
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const createdTask = await createTask(newTask);
      
      setTasks(prevTasks => [createdTask, ...prevTasks]);
      setNewTask({
        title: '',
        description: '',
        completed: false,
        priority: 'medium',
        dueDate: null,
        category: 'personal'
      });
      
      setIsDialogOpen(false);
      
      toast({
        title: "Task added",
        description: "Your task has been added successfully"
      });
    } catch (err) {
      console.error('Error adding task:', err);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      const updatedTask = await updateTask(id, { completed: !completed });
      
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === id ? updatedTask : task)
      );
      
      toast({
        title: completed ? "Task marked as incomplete" : "Task completed",
        description: `Task has been marked as ${completed ? 'incomplete' : 'complete'}`
      });
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Delete a task
  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
      
      toast({
        title: "Task deleted",
        description: "Your task has been deleted"
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Start editing a task
  const startEditTask = (task: TaskType) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // Save edited task
  const saveEditedTask = async () => {
    if (!editingTask) return;
    
    if (!editingTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { _id, createdAt, ...taskData } = editingTask;
      const updatedTask = await updateTask(_id, taskData);
      
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === _id ? updatedTask : task)
      );
      
      setIsEditDialogOpen(false);
      setEditingTask(null);
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully"
      });
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (categories.includes(newCategory.toLowerCase())) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createCategory(newCategory);
      
      setCategories(prevCategories => [...prevCategories, newCategory.toLowerCase()]);
      setNewCategory('');
      setIsCategoryDialogOpen(false);
      
      toast({
        title: "Category added",
        description: "New category has been added"
      });
    } catch (err) {
      console.error('Error adding category:', err);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Get due date status
  const getDueDateStatus = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    
    const diffTime = dueDay.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 2) return 'soon';
    return 'future';
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="task-manager-theme">
      <div className="min-h-screen bg-background p-4 md:p-8">
        <header className="container mx-auto flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Task Manager</h1>
          <ModeToggle />
        </header>
        
        <main className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="whitespace-nowrap">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task with details below
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Task description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setNewTask({...newTask, priority: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTask.category}
                        onValueChange={(value) => setNewTask({...newTask, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.dueDate ? format(newTask.dueDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newTask.dueDate || undefined}
                            onSelect={(date) => setNewTask({...newTask, dueDate: date as unknown as Date})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Task'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category to organize your tasks
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        placeholder="Enter category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Category'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="high-priority">High Priority</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="pt-6 text-center text-destructive">
                    {error}
                  </CardContent>
                </Card>
              ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No tasks found. Add a new task to get started.
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map(task => (
                  <Card key={task._id} className={task.completed ? "opacity-70" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task._id, task.completed)}
                            className="mt-1"
                          />
                          <div>
                            <CardTitle className={task.completed ? "line-through" : ""}>
                              {task.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {task.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => startEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 flex flex-wrap gap-2">
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                      
                      <Badge variant="outline">
                        {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                      </Badge>
                      
                      {task.dueDate && (
                        <Badge 
                          variant={
                            (getDueDateStatus(task.dueDate) === 'overdue' 
                            ? 'destructive' 
                            : getDueDateStatus(task.dueDate) === 'today' 
                              ? 'warning' 
                              : 'outline') as "default" | "destructive" | "outline" | "secondary" | null | undefined
                          }
                          className="flex items-center gap-1"
                        >
                          {getDueDateStatus(task.dueDate) === 'overdue' && <AlertCircle className="h-3 w-3" />}
                          {getDueDateStatus(task.dueDate) === 'today' && <Clock className="h-3 w-3" />}
                          {getDueDateStatus(task.dueDate) === 'soon' && <Clock className="h-3 w-3" />}
                          Due: {format(new Date(task.dueDate), 'PPP')}
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
        
        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update your task details
              </DialogDescription>
            </DialogHeader>
            
            {editingTask && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="Task title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Task description"
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setEditingTask({...editingTask, priority: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTask.category}
                    onValueChange={(value) => setEditingTask({...editingTask, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingTask.dueDate ? format(new Date(editingTask.dueDate), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingTask.dueDate ? new Date(editingTask.dueDate) : undefined}
                        onSelect={(date) => setEditingTask({...editingTask, dueDate: date as unknown as Date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="edit-completed"
                    checked={editingTask.completed}
                    onCheckedChange={(checked) => 
                      setEditingTask({...editingTask, completed: checked as boolean})
                    }
                  />
                  <Label htmlFor="edit-completed">Mark as completed</Label>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditedTask} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;