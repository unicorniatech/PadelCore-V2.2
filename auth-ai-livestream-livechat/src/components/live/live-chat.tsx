import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Shield, AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '../auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
  };
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function LiveChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is blocked
    if (user) {
      checkBlockStatus();
    }

    // Load initial messages
    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, handleNewMessage)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
      }, handleMessageUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkBlockStatus = async () => {
    const { data } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setIsBlocked(!!data && (!data.expires_at || new Date(data.expires_at) > new Date()));
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, content, created_at, status, profiles!chat_messages_profile_id_fkey(id, username, full_name)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data.map(msg => ({
      id: msg.id,
      user: {
        id: msg.profiles?.id,
        name: msg.profiles?.full_name || msg.profiles?.username || 'Usuario',
      },
      message: msg.content || '',
      timestamp: new Date(msg.created_at).toLocaleTimeString(),
      status: msg.status,
    })));
  };

  const handleNewMessage = (payload: any) => {
    const msg = payload.new;
    if (msg.status === 'approved' || !user?.role || user.role === 'admin') {
      const profile = msg.profiles || {}; // Using profiles from profile_id relationship
      setMessages(prev => [...prev, {
        id: msg.id,
        user: {
          id: profile.id,
          name: profile.full_name || profile.username || 'Usuario',
        },
        message: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString(),
        status: msg.status,
      }]);
    }
  };

  const handleMessageUpdate = (payload: any) => {
    const updatedMsg = payload.new;
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMsg.id 
        ? {
            ...msg,
            status: updatedMsg.status,
          }
        : msg
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isBlocked) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          profile_id: user.id,
          content: input.trim(),
          status: user.role === 'admin' ? 'approved' : 'pending',
        }]);

      if (error) throw error;
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const handleModeration = async (messageId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          moderated_at: new Date().toISOString(),
          moderated_by: user!.id,
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Mensaje Aprobado" : "Mensaje Rechazado",
        description: "La moderación se ha aplicado exitosamente",
      });
    } catch (error) {
      console.error('Error moderating message:', error);
      toast({
        title: "Error",
        description: "No se pudo moderar el mensaje",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: userId,
          blocked_by: user!.id,
          reason: 'Violación de normas del chat',
        });

      if (error) throw error;

      toast({
        title: "Usuario Bloqueado",
        description: "El usuario ha sido bloqueado del chat",
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "No se pudo bloquear al usuario",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat en Vivo
        </h2>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                msg.user.id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] space-y-1 ${
                  msg.user.id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                } ${
                  msg.status === 'rejected' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{msg.user.name}</span>
                  {user?.role === 'admin' && msg.user.id !== user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 hover:bg-primary/10"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {msg.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleModeration(msg.id, 'approve')}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Aprobar Mensaje
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleModeration(msg.id, 'reject')}
                              className="text-red-500"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Rechazar Mensaje
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleBlockUser(msg.user.id)}
                          className="text-red-500"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Bloquear Usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-70">{msg.timestamp}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={
              !user 
                ? "Inicia sesión para chatear" 
                : isBlocked 
                ? "Usuario bloqueado" 
                : "Escribe un mensaje..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!user || isBlocked}
          />
          <Button type="submit" size="icon" disabled={!user || isBlocked}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}