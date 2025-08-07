"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Share,
  Clock,
  User,
  Tag,
  Star,
  BookmarkPlus,
  Send,
  Sparkles,
  ExternalLink,
  Shield,
  Eye,
  Loader2,
  X,
  Bot
} from "lucide-react";
import { getTicketById, voteOnTicket, replyToTicket, getUserPermissions, closeTicket } from '@/actions/user';
import { chatbotAi } from '@/actions/chatbot';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

const TicketDetailPage = () => {
  const params = useParams();
  const ticketId = params.id;

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [reply, setReply] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    canReply: false,
    canClose: false,
    canVote: false,
    isOwner: false,
    userRole: null,
  });
  const [closeLoading, setCloseLoading] = useState(false);
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

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      try {
        setLoading(true);
        const [ticket, userPerms] = await Promise.all([
          getTicketById(ticketId),
          getUserPermissions(ticketId)
        ]);

        if (!ticket) {
          setError('Ticket not found');
          return;
        }
        console.log('Loaded ticket:', ticket);
        setTicketData(ticket);
        setVotes(ticket.upvotes - ticket.downvotes);
        setUserVote(ticket.userVote); // Set the current user's vote status
        setPermissions(userPerms);

        // Check if user has voted (from the votes array)
        // Note: You'll need to get current user info to check this properly

      } catch (err) {
        console.error('Failed to load ticket:', err);
        setError(err.message || 'Failed to load ticket');
        toast.error('Failed to load ticket', {
          description: err.message || 'Something went wrong. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const handleVote = async (type) => {
    if (!ticketData || !permissions.canVote) return;

    try {
      const isUpvote = type === 'up';
      const result = await voteOnTicket(ticketData.id, isUpvote);

      // Update local state based on the result
      if (result.action === 'removed') {
        setUserVote(null);
        setVotes(prev => type === 'up' ? prev - 1 : prev + 1);
        toast.success('Vote removed');
      } else if (result.action === 'added') {
        setUserVote(result.vote);
        setVotes(prev => type === 'up' ? prev + 1 : prev - 1);
        toast.success(`Vote ${type === 'up' ? 'up' : 'down'} added`);
      } else if (result.action === 'changed') {
        const oldVote = userVote;
        setUserVote(result.vote);
        setVotes(prev => type === 'up' ? prev + 2 : prev - 2);
        toast.success(`Vote changed to ${type === 'up' ? 'up' : 'down'}`);
      }

    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error('Failed to vote', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !ticketData || !permissions.canReply) return;

    try {
      setReplyLoading(true);
      const newComment = await replyToTicket(ticketData.id, reply);

      // Update local state with the new comment
      setTicketData(prev => ({
        ...prev,
        status: 'RESOLVED', // Update status to resolved
        comments: [...(prev.comments || []), newComment]
      }));

      setReply('');
      toast.success('Reply posted successfully! Ticket status updated to resolved.');

    } catch (error) {
      console.error('Failed to post reply:', error);
      toast.error('Failed to post reply', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleShare = () => {
    // Create shareable link
    const shareUrl = `${window.location.origin}/ticket/${ticketId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleCloseTicket = async () => {
    if (!ticketData || !permissions.canClose) return;

    try {
      setCloseLoading(true);
      await closeTicket(ticketData.id);

      // Update local state
      setTicketData(prev => ({
        ...prev,
        status: 'CLOSED',
        closedAt: new Date()
      }));

      toast.success('Ticket closed successfully!');

    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setCloseLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Auto-scroll chat to bottom when new messages are added
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Handle AI Chat Submit
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
      // Check if this is the first user message (only initial AI message exists)
      const isFirstUserMessage = chatMessages.filter(msg => msg.type === 'user').length === 0;
      
      // Call the AI chatbot
      const aiResponse = await chatbotAi({
        message: userMessage,
        ticketId: ticketData?.id,
        ticketData: ticketData,
        isFirstMessage: isFirstUserMessage
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 p-6">
      <div className="max-w-4xl mx-auto mt-16">
        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-blue-600 font-medium">Loading ticket...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <Shield className="h-12 w-12 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  {error}
                </h3>
                <p className="text-red-600">
                  The ticket you're looking for might not exist or you don't have permission to view it.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content - Only show if ticket data exists */}
        {ticketData && !loading && !error && (
          <>
            {/* Header with Ticket Info */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 "
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Ticket #{ticketData.id}
                </h1>
                <Badge className={`${getStatusColor(ticketData.status)} border`}>
                  {ticketData.status}
                </Badge>
                <Badge className={`${getPriorityColor(ticketData.priority)} border`}>
                  {ticketData.priority}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-blue-600">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{ticketData.viewCount || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{ticketData.comments?.length || 0} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created at {new Date(ticketData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Main Ticket Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm border-blue-200 shadow-2xl overflow-hidden flex justify-center">
                <CardHeader className="mx-6 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 border-b border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                        {ticketData.subject}
                      </CardTitle>

                      {/* Category and Tags */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                          {ticketData.category?.name || 'No Category'}
                        </Badge>
                        {/* Tags would go here if you implement a Tag system */}
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                          <AvatarImage src={ticketData.creator?.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                            {ticketData.creator?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{ticketData.creator?.name || 'Unknown User'}</p>
                          <p className="text-sm text-blue-600">
                            {new Date(ticketData.createdAt).toLocaleDateString()} at {new Date(ticketData.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-2 ml-6">
                      <motion.button
                        whileHover={{ scale: permissions.canVote ? 1.1 : 1 }}
                        whileTap={{ scale: permissions.canVote ? 0.9 : 1 }}
                        onClick={() => permissions.canVote && handleVote('up')}
                        disabled={!permissions.canVote}
                        className={`p-2 rounded-full transition-all duration-200 ${!permissions.canVote
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : userVote === 'up'
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-white/70 text-blue-600 hover:bg-green-50 hover:text-green-600'
                          }`}
                      >
                        <ChevronUp className="h-6 w-6" />
                      </motion.button>

                      <div className="font-bold text-lg text-gray-900 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                        {votes}
                      </div>

                      <motion.button
                        whileHover={{ scale: permissions.canVote ? 1.1 : 1 }}
                        whileTap={{ scale: permissions.canVote ? 0.9 : 1 }}
                        onClick={() => permissions.canVote && handleVote('down')}
                        disabled={!permissions.canVote}
                        className={`p-2 rounded-full transition-all duration-200 ${!permissions.canVote
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : userVote === 'down'
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-white/70 text-blue-600 hover:bg-red-50 hover:text-red-600'
                          }`}
                      >
                        <ChevronDown className="h-6 w-6" />
                      </motion.button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  {/* Ticket Content */}
                  <div className="prose prose-blue max-w-none mb-8">
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                      {ticketData.description}
                    </p>
                  </div>

                  {/* Show attachments if any */}
                  {ticketData.attachments && ticketData.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-blue-800 mb-3">Attachments:</h4>
                      <div className="grid gap-2">
                        {ticketData.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-blue-600 text-sm font-medium">{attachment.originalName}</span>
                            <Badge variant="outline" className="text-xs">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-6 bg-blue-200" />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsBookmarked(!isBookmarked)}
                          className={`border-blue-300 hover:bg-blue-50 ${isBookmarked ? 'bg-blue-100 text-blue-700' : 'text-blue-600'
                            }`}
                        >
                          <BookmarkPlus className="h-4 w-4 mr-2" />
                          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </motion.div>
                    </div>

                    {/* Owner/Admin Actions */}
                    <div className="flex items-center gap-2">
                      {permissions.canClose && ticketData.status !== 'CLOSED' && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCloseTicket}
                            disabled={closeLoading}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {closeLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4 mr-2" />
                            )}
                            {closeLoading ? 'Closing...' : 'Close Ticket'}
                          </Button>
                        </motion.div>
                      )}

                      <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50">
                        <Shield className="h-3 w-3 mr-1" />
                        {permissions.userRole || 'END_USER'}
                      </Badge>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Create Public Link
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Comments/Replies Section */}
            {ticketData.comments && ticketData.comments.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6"
              >
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg ">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex  items-center pt-6">
                    <CardTitle className="text-blue-800">
                      Replies ({ticketData.comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {ticketData.comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.author?.avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-gray-900">{comment.author?.name || 'Unknown'}</span>
                          <span className="text-xs text-blue-600">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* No Answers Section */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <MessageCircle className="h-12 w-12 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      There are no answers yet
                    </h3>
                    <p className="text-blue-600">
                      Be the first to answer this question
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Reply Section - Only show for ADMIN and SUPPORT_AGENT */}
            {permissions.canReply && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6"
              >
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">

                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 rounded-t-lg flex items-center  pt-4">
                    <CardTitle className="text-blue-800 text-lg font-semibold flex items-center gap-2 pt-4">
                      
                      Post Your Reply
                      <p className="text-sm text-blue-600">
                      Only administrators and support agents can reply to tickets
                    </p>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleReplySubmit} className="space-y-4">
                      <Textarea
                        placeholder="Write your answer here... Be detailed and helpful!"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className="min-h-[120px] bg-white/70 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                        required
                      />

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-600">
                          Your reply will resolve this ticket automatically
                        </p>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            type="submit"
                            disabled={replyLoading || !reply.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {replyLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Reply & Resolve
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* No Reply Permission Message */}
            {!permissions.canReply && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6"
              >
                <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Shield className="h-12 w-12 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Reply Restricted
                    </h3>
                    <p className="text-yellow-700">
                      Only administrators and support agents can reply to tickets.
                      You can vote on this ticket to show your support.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Related/Similar Tickets */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-8"
            >
              <Card className="bg-white/50 backdrop-blur-sm border-blue-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Similar Questions
                  </h4>
                  <div className="space-y-2 text-sm text-blue-600">
                    <div className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>How to integrate AI tools in development workflow?</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Best practices for hackathon preparation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Using machine learning in competitive programming</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

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
                            className={`max-w-[220px] p-2 rounded-lg shadow-sm border ${
                              msg.type === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-300'
                                : 'bg-white/80 text-gray-700 border-purple-100'
                            }`}
                          >
                            <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 opacity-70 ${
                              msg.type === 'user' ? 'text-blue-100' : 'text-purple-500'
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

export default TicketDetailPage;
