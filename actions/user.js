"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
// import sendEmail from "./sendEmail";

export async function testDatabaseConnection() {
  try {
    const result = await db.$queryRaw`SELECT 1 as test`;
    return { success: true, result };
  } catch (error) {
    console.error("Database connection test failed:", error);
    return { success: false, error: error.message };
  }
}

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
      },
      orderBy: { name: "asc" },
    });

    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCategories = [
        {
          name: "Technical",
          description: "Technical support and troubleshooting",
          color: "#3B82F6",
        },
        {
          name: "Billing",
          description: "Billing and payment related inquiries",
          color: "#8B5CF6",
        },
        {
          name: "General",
          description: "General questions and information",
          color: "#10B981",
        },
        {
          name: "Account",
          description: "Account management and settings",
          color: "#F59E0B",
        },
        {
          name: "Support",
          description: "Customer support requests",
          color: "#EF4444",
        },
      ];

      const createdCategories = [];
      for (const category of defaultCategories) {
        const created = await db.category.create({
          data: category,
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        });
        createdCategories.push(created);
      }
      return createdCategories;
    }

    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function createTicket(data) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized - Please sign in to create a ticket");
  }

  // Find or create user in our database
  let user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    // If user doesn't exist in our database, we might need to create them
    // This could happen if they signed up but weren't automatically added to our DB
    throw new Error("User not found in database. Please contact support.");
  }

  console.log("User found:", { id: user.id, name: user.name });

  // Validate required fields
  if (!data.question || !data.question.trim()) {
    throw new Error("Question title is required");
  }
  if (!data.description || !data.description.trim()) {
    throw new Error("Description is required");
  }
  if (!data.category) {
    throw new Error("Category is required");
  }

  // Find category by name if provided
  let categoryId = data.categoryId;
  if (data.category && !categoryId) {
    const category = await db.category.findFirst({
      where: {
        name: {
          equals:
            data.category.charAt(0).toUpperCase() +
            data.category.slice(1).toLowerCase(),
          mode: "insensitive",
        },
      },
    });
    categoryId = category?.id;
    console.log("Category found:", category);
  }

  if (!categoryId) {
    throw new Error("Valid category is required");
  }

  const ticketData = {
    subject: data.question || data.subject,
    description: data.description,
    priority: data.priority || "MEDIUM",
    categoryId: categoryId,
    creatorId: user.id,
  };

  console.log("Creating ticket with:", ticketData);

  const ticket = await db.ticket.create({
    data: ticketData,
  });

  console.log("Ticket created:", ticket);

  // Handle tags if provided
  if (data.tags && data.tags.trim()) {
    const tagNames = data.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);
    console.log("Tags to process:", tagNames);
  }

  // Handle attachments if provided
  if (data.attachments && data.attachments.length > 0) {
    console.log("Processing attachments:", data.attachments.length);
    const attachmentPromises = data.attachments.map(attachment =>
      db.attachment.create({
        data: {
          filename: `${Date.now()}_${attachment.name}`, // Add timestamp to avoid conflicts
          originalName: attachment.name,
          mimeType: attachment.type,
          size: attachment.size,
          url: `/uploads/${ticket.id}/${Date.now()}_${attachment.name}`, // Placeholder URL
          ticketId: ticket.id,
          uploadedById: user.id,
        },
      })
    );
    await Promise.all(attachmentPromises);
    console.log("Attachments created");
  }

  // await sendEmail({
  //   to: user.email,
  //   subject: `✅ Ticket Submitted: ${ticket.subject}`,
  //   react: (
  //     <div>
  //       <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
  //         Hi {user.name},
  //       </h2>
  //       <p>
  //         Thank you for submitting your ticket. Our team will get back soon.
  //       </p>
  //       <p>
  //         <strong>Ticket ID:</strong> {ticket.id}
  //       </p>
  //       <p>
  //         <strong>Subject:</strong> {ticket.subject}
  //       </p>
  //       <p>
  //         <strong>Description:</strong> {ticket.description}
  //       </p>
  //       <br />
  //       <p>– QuickDesk Support</p>
  //     </div>
  //   ),
  // });

  return ticket;
}

export async function getUserAllTickets() {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }
  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch only tickets created by this user
  const tickets = await db.ticket.findMany({
    where: { creatorId: user.id },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tickets;
}

export async function getTicketById(ticketId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Allow anyone to view tickets (remove creator restriction for public viewing)
  const ticket = await db.ticket.findFirst({
    where: {
      id: ticketId,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Show oldest comments first
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
        },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
      notifications: true,
    },
  });

  if (!ticket) return null;

  // Increment view count
  await db.ticket.update({
    where: { id: ticketId },
    data: { viewCount: { increment: 1 } },
  });

  // Find current user's vote
  const userVote = ticket.votes.find(vote => vote.user.id === user.id);
  const userVoteStatus = userVote ? (userVote.isUpvote ? "up" : "down") : null;

  // Add user vote status to the response
  return {
    ...ticket,
    userVote: userVoteStatus,
  };
}

export async function voteOnTicket(ticketId, isUpvote) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized - Please sign in to vote");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  try {
    // Check if user has already voted
    const existingVote = await db.vote.findUnique({
      where: {
        ticketId_userId: {
          ticketId: ticketId,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.isUpvote === isUpvote) {
        // Remove vote if clicking the same vote
        await db.vote.delete({
          where: { id: existingVote.id },
        });

        // Update ticket vote counts
        await db.ticket.update({
          where: { id: ticketId },
          data: {
            upvotes: isUpvote ? { decrement: 1 } : undefined,
            downvotes: !isUpvote ? { decrement: 1 } : undefined,
          },
        });

        return { action: "removed", vote: null };
      } else {
        // Change vote
        await db.vote.update({
          where: { id: existingVote.id },
          data: { isUpvote },
        });

        // Update ticket vote counts
        await db.ticket.update({
          where: { id: ticketId },
          data: {
            upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
            downvotes: !isUpvote ? { increment: 1 } : { decrement: 1 },
          },
        });

        return { action: "changed", vote: isUpvote ? "up" : "down" };
      }
    } else {
      // Create new vote
      await db.vote.create({
        data: {
          ticketId,
          userId: user.id,
          isUpvote,
        },
      });

      // Update ticket vote counts
      await db.ticket.update({
        where: { id: ticketId },
        data: {
          upvotes: isUpvote ? { increment: 1 } : undefined,
          downvotes: !isUpvote ? { increment: 1 } : undefined,
        },
      });

      return { action: "added", vote: isUpvote ? "up" : "down" };
    }
  } catch (error) {
    console.error("Error voting on ticket:", error);
    throw new Error("Failed to process vote");
  }
}

export async function replyToTicket(ticketId, content) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized - Please sign in to reply");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has permission to reply (only ADMIN and SUPPORT_AGENT)
  if (user.role !== "ADMIN" && user.role !== "SUPPORT_AGENT") {
    throw new Error(
      "Only administrators and support agents can reply to tickets"
    );
  }

  if (!content || !content.trim()) {
    throw new Error("Reply content is required");
  }

  try {
    // Create the comment
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        ticketId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update ticket status to RESOLVED when a reply is added
    await db.ticket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    return comment;
  } catch (error) {
    console.error("Error creating reply:", error);
    throw new Error("Failed to create reply");
  }
}

export async function closeTicket(ticketId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized - Please sign in to close ticket");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  try {
    // Get the ticket to check ownership
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        creatorId: true,
        status: true,
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Check if user is the ticket owner or has admin/support privileges
    const canClose =
      ticket.creatorId === user.id ||
      user.role === "ADMIN" ||
      user.role === "SUPPORT_AGENT";

    if (!canClose) {
      throw new Error(
        "Only ticket owners, administrators, or support agents can close tickets"
      );
    }

    // Update ticket status to CLOSED
    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return updatedTicket;
  } catch (error) {
    console.error("Error closing ticket:", error);
    throw new Error("Failed to close ticket");
  }
}

export async function getUserPermissions(ticketId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return {
      canReply: false,
      canClose: false,
      canVote: false,
      isOwner: false,
      userRole: null,
    };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    return {
      canReply: false,
      canClose: false,
      canVote: false,
      isOwner: false,
      userRole: null,
    };
  }

  let isOwner = false;
  if (ticketId) {
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      select: { creatorId: true },
    });
    isOwner = ticket?.creatorId === user.id;
  }

  const canReply = user.role === "ADMIN" || user.role === "SUPPORT_AGENT";
  const canClose =
    isOwner || user.role === "ADMIN" || user.role === "SUPPORT_AGENT";
  const canVote = true; // All authenticated users can vote

  return {
    canReply,
    canClose,
    canVote,
    isOwner,
    userRole: user.role,
  };
}

export async function getAllTickets(filters = {}) {
  try {
    const {
      search = "",
      category = "all",
      status = "all",
      sortBy = "recent",
      showOpenOnly = false,
      page = 1,
      limit = 10,
    } = filters;

    // Build where conditions
    const whereConditions = {};

    // Search functionality
    if (search && search.trim()) {
      whereConditions.OR = [
        {
          subject: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      whereConditions.category = {
        name: {
          equals:
            category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
          mode: "insensitive",
        },
      };
    }

    // Status filter
    if (showOpenOnly) {
      whereConditions.status = "OPEN";
    } else if (status && status !== "all") {
      whereConditions.status = status.toUpperCase();
    }

    // Build orderBy conditions
    let orderBy = {};
    switch (sortBy) {
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "mostUpvoted":
        // Sort by calculated upvotes - downvotes, then fallback to upvotes field
        orderBy = [
          { upvotes: "desc" },
          { downvotes: "asc" },
          { createdAt: "desc" }
        ];
        break;
      case "mostViewed":
        orderBy = { viewCount: "desc" };
        break;
      case "priority":
        orderBy = { priority: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch tickets
    const [tickets, totalCount] = await Promise.all([
      db.ticket.findMany({
        where: whereConditions,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.ticket.count({
        where: whereConditions,
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    return {
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw new Error("Failed to fetch tickets");
  }
}

export async function getGlobalStats() {
  try {
  
    const totalTickets = await db.ticket.count();

    // Get count of resolved tickets (resolved or closed)
    const resolvedTickets = await db.ticket.count({
      where: {
        status: {
          in: ['RESOLVED', 'CLOSED']
        }
      }
    });

    // Get total views across all tickets
    const viewsResult = await db.ticket.aggregate({
      _sum: {
        viewCount: true
      }
    });
    const totalViews = viewsResult._sum.viewCount || 0;

    // Get total upvotes across all tickets
    const upvotesResult = await db.ticket.aggregate({
      _sum: {
        upvotes: true
      }
    });
    const totalUpvotes = upvotesResult._sum.upvotes || 0;

    // Get count by status for detailed breakdown
    const statusCounts = await db.ticket.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Convert status counts to a more usable format
    const statusStats = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    statusCounts.forEach(item => {
      const status = item.status.toLowerCase();
      statusStats[status] = item._count.status;
    });

    return {
      totalTickets,
      resolvedTickets,
      totalViews,
      totalUpvotes,
      statusStats,
      success: true
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return {
      totalTickets: 0,
      resolvedTickets: 0,
      totalViews: 0,
      totalUpvotes: 0,
      statusStats: {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      },
      success: false,
      error: error.message
    };
  }
}
