import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const deadlines = [
  { id: 1, title: "IT Support Services RFP", agency: "Department of Defense", deadline: "Dec 15, 2024", daysLeft: 2, priority: "high" },
  { id: 2, title: "Cybersecurity Assessment", agency: "DHS", deadline: "Dec 18, 2024", daysLeft: 5, priority: "high" },
  { id: 3, title: "Cloud Migration Services", agency: "GSA", deadline: "Dec 22, 2024", daysLeft: 9, priority: "medium" },
  { id: 4, title: "Data Analytics Platform", agency: "HHS", deadline: "Dec 28, 2024", daysLeft: 15, priority: "medium" },
  { id: 5, title: "Network Infrastructure", agency: "DOE", deadline: "Jan 5, 2025", daysLeft: 23, priority: "low" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-destructive/20 text-destructive border-destructive/50";
    case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    case "low": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <DashboardLayout title="Deadline Calendar">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate() && 
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear();
                const hasDeadline = [15, 18, 22, 28].includes(day) && currentMonth.getMonth() === 11;
                
                return (
                  <div 
                    key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors
                      ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}
                      ${hasDeadline ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''}
                    `}
                  >
                    <span className="text-sm">{day}</span>
                    {hasDeadline && (
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Upcoming Deadlines
            </h3>
            
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <div 
                  key={deadline.id}
                  className={`p-4 rounded-lg border ${getPriorityColor(deadline.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">{deadline.title}</h4>
                    {deadline.daysLeft <= 3 && (
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{deadline.agency}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{deadline.deadline}</span>
                    <Badge variant="outline" className="text-xs">
                      {deadline.daysLeft} days left
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
