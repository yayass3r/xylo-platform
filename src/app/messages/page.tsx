'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Send,
  Search,
  Loader2,
  User,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Conversation {
  id: string;
  type: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      avatar: string | null;
    };
    unreadCount: number;
  }>;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  status: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchConversations(token);
  }, [router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async (token: string) => {
    try {
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const currentUserId = localStorage.getItem('user');
    const userData = currentUserId ? JSON.parse(currentUserId) : null;
    return conversation.participants.find((p) => p.user.id !== userData?.id)?.user;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">الرسائل</h1>

        <Card className="h-[calc(100vh-200px)] min-h-[600px]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-l flex flex-col">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في المحادثات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد محادثات</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      ابدأ محادثة جديدة من صفحة مستخدم آخر
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation) => {
                      const otherUser = getOtherParticipant(conversation);
                      const participant = conversation.participants[0];
                      const isSelected = selectedConversation?.id === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-violet-50 border-r-2 border-violet-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser?.avatar || undefined} />
                              <AvatarFallback className="bg-violet-100 text-violet-700">
                                {otherUser?.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">
                                  {otherUser?.name || otherUser?.username}
                                </p>
                                {conversation.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(conversation.lastMessageAt).toLocaleDateString('ar-SA')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessagePreview || 'ابدأ المحادثة...'}
                                </p>
                                {participant.unreadCount > 0 && (
                                  <Badge className="bg-violet-600">
                                    {participant.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar || undefined} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {getOtherParticipant(selectedConversation)?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {getOtherParticipant(selectedConversation)?.name}
                        </p>
                        <p className="text-xs text-green-500">متصل الآن</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Info className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const currentUserId = localStorage.getItem('user');
                          const userData = currentUserId ? JSON.parse(currentUserId) : null;
                          const isMine = message.senderId === userData?.id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                  isMine
                                    ? 'bg-violet-600 text-white rounded-tr-none'
                                    : 'bg-slate-100 rounded-tl-none'
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${isMine ? 'text-violet-200' : 'text-muted-foreground'}`}>
                                  {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" type="button">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button">
                        <ImageIcon className="w-5 h-5" />
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" type="button">
                        <Smile className="w-5 h-5" />
                      </Button>
                      <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-700">
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">اختر محادثة للبدء</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
