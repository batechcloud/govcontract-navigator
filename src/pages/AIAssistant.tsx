import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your GovAI Helper. I can help you find the right contracts, explain confusing terms, and guide you through the bidding process. What can I help with?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      "Great question! Government contracts might seem complicated, but the key is to focus on contracts that match what your business already does well. Start by searching for keywords related to your services.",
      "I can help with that! When you find a contract you like, save it first. Then I can help you write a proposal that highlights your strengths and addresses exactly what the agency is looking for.",
      "That's a common concern for first-time bidders. The good news is that many contracts are specifically set aside for small businesses like yours. Use the 'Small Business' filter when searching to find these opportunities."
    ];

    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: responses[Math.floor(Math.random() * responses.length)]
    }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What contracts fit my business?",
    "How do I get started bidding?",
    "Help me understand a contract",
    "Tips for writing a winning proposal",
  ];

  return (
    <DashboardLayout title="Ask GovAI">
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
        {/* Chat Header */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">GovAI Helper</h2>
            <p className="text-sm text-muted-foreground">Your friendly guide to government contracts</p>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div 
                className={`max-w-[80%] p-4 rounded-xl ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card/50 border border-border/50"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card/50 border border-border/50 p-4 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <motion.div 
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setInput(suggestion)}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about government contracts..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
