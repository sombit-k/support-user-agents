"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getCategories, getAllTickets, getGlobalStats } from "@/actions/user";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import {
  Search as IconSearch,
  Loader2 as IconLoader2,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  Sparkles,
  MessageSquare,
  Users,
  Eye,
  ThumbsUp,
  Filter,
  SortAsc,
  Calendar,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  Bot,
  X,
  Send,
  User,
  Loader2
} from "lucide-react";
import { generalChat } from '@/actions/chatbot';

const HomePage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("");
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Data states
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    totalViews: 0,
    totalUpvotes: 0,
    statusStats: {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    }
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "Hi! I'm your AI support assistant. I can help you understand this ticket, suggest solutions, or answer questions about the issue. How can I assist you?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Load categories and global stats on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setStatsLoading(true);

        // Load categories
        const categoriesData = await getCategories();
        setCategories(categoriesData);

        // Load global stats
        const statsData = await getGlobalStats();
        if (statsData.success) {
          setGlobalStats(statsData);
        } else {
          console.error('Failed to load global stats:', statsData.error);
          toast.error('Failed to load statistics');
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        toast.error('Failed to load initial data');
      } finally {
        setStatsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load tickets whenever filters change
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const filters = {
          search: searchQuery,
          category: selectedCategory,
          status: selectedStatus,
          sortBy: sortBy,
          showOpenOnly: showOpenOnly,
          page: currentPage,
          limit: 10
        };

        const result = await getAllTickets(filters);
        setTickets(result.tickets);
        setPagination(result.pagination);
        setError(null);
      } catch (err) {
        console.error('Failed to load tickets:', err);
        setError('Failed to load tickets');
        toast.error('Failed to load tickets', {
          description: err.message || 'Something went wrong. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, showOpenOnly, currentPage]);

  // Handle search with debounce - only reset page when search query changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page when search changes
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]); // Removed currentPage from dependency array

  const handleAskQuestion = () => {
    router.push('/ask');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to get status styling
  const getStatusStyle = (ticketStatus) => {
    switch (ticketStatus.toLowerCase()) {
      case 'open':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          dotColor: 'bg-yellow-500'
        };
      case 'in_progress':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'resolved':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          dotColor: 'bg-green-500'
        };
      case 'closed':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-500'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage.trim();
    const userMessageObj = {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessageObj]);
    setChatMessage('');
    setChatLoading(true);

    try {
      // Call the AI chatbot
      const aiResponse = await generalChat({
        message: userMessage
      });

      if (aiResponse.success) {
        const aiMessageObj = {
          id: Date.now() + 1,
          type: 'ai',
          message: aiResponse.message,
          timestamp: aiResponse.timestamp
        };
        
        setChatMessages(prev => [...prev, aiMessageObj]);
      } else {
        // Handle error
        const errorMessageObj = {
          id: Date.now() + 1,
          type: 'ai',
          message: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, errorMessageObj]);
        toast.error('AI response failed', {
          description: aiResponse.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessageObj = {
        id: Date.now() + 1,
        type: 'ai',
        message: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, errorMessageObj]);
      toast.error('Failed to send message', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-sky-200 p-6">
      <div className="max-w-6xl mx-auto mt-18">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Community Support Hub
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover answers, share knowledge, and connect with our community
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {statsLoading ? (
            // Loading State for Stats
            <>
              {[1, 2, 3, 4].map((index) => (
                <Card key={index} className="bg-gradient-to-r from-gray-200 to-gray-300 border-0 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-400 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-400 rounded w-16 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            // Actual Stats
            <>
              <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8" />
                    <div>
                      <p className="text-2xl font-bold">{globalStats.totalTickets}</p>
                      <p className="text-blue-100 text-sm">Total Questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8" />
                    <div>
                      <p className="text-2xl font-bold">{globalStats.resolvedTickets}</p>
                      <p className="text-green-100 text-sm">Resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8" />
                    <div>
                      <p className="text-2xl font-bold">{globalStats.totalViews}</p>
                      <p className="text-purple-100 text-sm">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-8 w-8" />
                    <div>
                      <p className="text-2xl font-bold">{globalStats.totalUpvotes}</p>
                      <p className="text-orange-100 text-sm">Total Upvotes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        {/* Search and Ask Question Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-blue-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search questions, topics, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-sm border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-800 pl-12 pr-4 py-4 rounded-xl text-lg shadow-sm hover:shadow-md transition-all duration-300"
                  />
                  <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                </div>

                {/* Ask Button */}
                <Button
                  onClick={handleAskQuestion}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ask Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-white via-sky-50 to-blue-50 border-blue-200 shadow-lg">
            <CardHeader className="mx-6 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200 rounded-t-lg flex items-center justify-center  pt-4">
              <CardTitle className="text-blue-800 text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 " />
                Filters & Sorting
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Quick Filters Row */}
              <div className="flex items-center gap-6 flex-wrap">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-200"
                >
                  <Checkbox
                    id="open-only"
                    checked={showOpenOnly}
                    onCheckedChange={(checked) => {
                      setShowOpenOnly(checked);
                      setCurrentPage(1);
                    }}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="open-only" className="text-blue-800 font-medium cursor-pointer">
                    Show open only
                  </label>
                </motion.div>

                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48 bg-white/70 backdrop-blur-sm border-blue-300 focus:border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name.toLowerCase()}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: category.color || '#3B82F6' }}></div>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    setShowOpenOnly(false); // Reset open-only filter when status changes
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40 bg-white/70 backdrop-blur-sm border-blue-300 focus:border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="ml-auto bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">
                      {loading ? 'Loading...' : `${pagination.totalCount} tickets found`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sort Options Row */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">Sort by:</span>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-2 rounded-lg p-3 border transition-all duration-300 ${sortBy === 'recent'
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white/70 backdrop-blur-sm border-blue-200'
                    }`}
                >
                  <Checkbox
                    id="recent"
                    checked={sortBy === 'recent'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSortBy('recent');
                        setCurrentPage(1);
                      }
                    }}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="recent" className="text-blue-700 cursor-pointer flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Most recent
                  </label>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-2 rounded-lg p-3 border transition-all duration-300 ${sortBy === 'mostUpvoted'
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white/70 backdrop-blur-sm border-blue-200'
                    }`}
                >
                  <Checkbox
                    id="upvoted"
                    checked={sortBy === 'mostUpvoted'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSortBy('mostUpvoted');
                        setCurrentPage(1);
                      }
                    }}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="upvoted" className="text-blue-700 cursor-pointer flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    Most upvoted
                  </label>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-2 rounded-lg p-3 border transition-all duration-300 ${sortBy === 'mostViewed'
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white/70 backdrop-blur-sm border-blue-200'
                    }`}
                >
                  <Checkbox
                    id="viewed"
                    checked={sortBy === 'mostViewed'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSortBy('mostViewed');
                        setCurrentPage(1);
                      }
                    }}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="viewed" className="text-blue-700 cursor-pointer flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Most viewed
                  </label>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-6 mb-8"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <IconLoader2 className="h-12 w-12 animate-spin text-blue-600" />
                      <div className="absolute -inset-2 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-800 font-semibold text-lg">Loading tickets...</p>
                      <p className="text-blue-600 text-sm mt-1">Please wait while we fetch the latest questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 shadow-xl">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-red-800">
                      Error Loading Tickets
                    </h3>
                    <p className="text-red-600 text-center max-w-md">
                      {error}
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-xl">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-800">
                      No Tickets Found
                    </h3>
                    <p className="text-blue-600 text-center max-w-lg">
                      {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || showOpenOnly
                        ? 'No tickets match your current filters. Try adjusting your search criteria.'
                        : 'No tickets have been created yet. Be the first to ask a question!'}
                    </p>
                    <Button
                      onClick={handleAskQuestion}
                      className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ask First Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <Link href={`/ticket/${ticket.id}`}>
                  <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Vote Section */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <span className="font-bold text-lg">{ticket.upvotes - ticket.downvotes}</span>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">votes</div>
                          <div className="flex flex-col gap-1">
                            <ArrowUp className="h-3 w-3 text-green-600" />
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          </div>
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Badge
                              variant="secondary"
                              className="text-white font-medium px-3 py-1 shadow-sm"
                              style={{ backgroundColor: ticket.category?.color || '#10B981' }}
                            >
                              {ticket.category?.name || 'No Category'}
                            </Badge>
                            <Badge className={`${getPriorityColor(ticket.priority)} px-3 py-1 shadow-sm`}>
                              {ticket.priority}
                            </Badge>
                            {/* Ticket Status */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${getStatusStyle(ticket.status).bgColor} ${getStatusStyle(ticket.status).textColor} ${getStatusStyle(ticket.status).borderColor}`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${getStatusStyle(ticket.status).dotColor} animate-pulse`}></div>
                              <span className="text-xs font-semibold">
                                {ticket.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-blue-900 font-bold text-lg mb-3 hover:text-blue-600 transition-colors group-hover:text-blue-700 line-clamp-2">
                            {ticket.subject}
                          </h3>

                          <div className="text-gray-700 mb-4">
                            <p className="line-clamp-2 leading-relaxed">{ticket.description}</p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-blue-600 bg-blue-50/50 rounded-lg p-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{ticket.creator?.name || 'Unknown User'}</span>
                            </div>
                            <span className="text-blue-400">•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(ticket.createdAt)}</span>
                            </div>
                            <span className="text-blue-400">•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{ticket.viewCount || 0} views</span>
                            </div>
                          </div>
                        </div>

                        {/* Replies Count */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex flex-col items-center"
                        >
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <div className="text-xl font-bold text-center">{ticket._count?.comments || 0}</div>
                          </div>
                          <div className="text-xs text-green-600 font-medium mt-2 text-center flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            replies
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {!loading && !error && tickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex justify-center"
          >
            <Card className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardContent className="p-1">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className={currentPage === pageNum
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
                          : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {pagination.totalPages > 7 && currentPage < pagination.totalPages - 3 && (
                    <>
                      <span className="text-blue-600 px-2">...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        onClick={() => handlePageChange(pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border-purple-200 shadow-lg">





            <CardHeader className="mx-6 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-blue-200 rounded-t-lg flex items-center justify-center pt-4">
              <CardTitle className="text-purple-800 text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-purple-700 mb-4 font-medium">
                Make the most of our community support platform:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-purple-600">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <IconSearch className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">Search First</span>
                  </div>
                  <span>Check if your question has been answered before</span>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">Be Detailed</span>
                  </div>
                  <span>Provide context and relevant information</span>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">Engage</span>
                  </div>
                  <span>Vote and respond to help others</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* AI Chat Button - Floating */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Bot className="h-6 w-6" />
          </motion.button>
        </motion.div>

        {/* AI Chat Drawer */}

        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 z-40 w-80"
          >
            <Card className=" bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl z-40">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 border-b border-purple-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className=" text-purple-800 text-lg font-semibold flex items-center gap-2 mt-4">
                    <Bot className="h-5 w-5" />
                    AI Support Assistant
                  </CardTitle>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsChatOpen(false)}
                    className=" hover:bg-purple-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-purple-600" />
                  </motion.button>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                {/* Chat Messages Area */}
                <div className="h-40 bg-gradient-to-b from-purple-50/50 to-blue-50/50 rounded-lg p-2 mb-3 overflow-y-auto border border-purple-100 chat-messages-container">
                  {chatMessages.length === 0 ? (
                    <>
                      <div className="flex items-start gap-2 mb-3">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-full">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg shadow-sm border border-purple-100 max-w-[220px]">
                          <p className="text-xs text-gray-700">
                            Hi! I'm your AI support assistant. I can help you understand this ticket, suggest solutions, or answer questions about the issue. How can I assist you?
                          </p>
                        </div>
                      </div>

                      <div className="text-center text-xs text-purple-500 mt-4">
                        Start a conversation with the AI assistant
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.type === 'ai' && (
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-full mr-2 h-6 w-6 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-3 w-3 text-white" />
                            </div>
                          )}

                          <div
                            className={`max-w-[220px] p-2 rounded-lg shadow-sm border ${msg.type === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-300'
                              : 'bg-white/80 text-gray-700 border-purple-100'
                              }`}
                          >
                            <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 opacity-70 ${msg.type === 'user' ? 'text-blue-100' : 'text-purple-500'
                              }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>

                          {msg.type === 'user' && (
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-full ml-2 h-6 w-6 flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}

                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-full mr-2 h-6 w-6 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <div className="bg-white/80 p-2 rounded-lg shadow-sm border border-purple-100 max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-xs text-purple-600">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask the AI about this ticket..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 bg-white/70 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-sm"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!chatMessage.trim() || chatLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg disabled:opacity-50"
                      >
                        {chatLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <p className="text-xs text-purple-600 text-center">
                    AI assistant is ready to help with this ticket
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
    </div>
  );
};

export default HomePage;
