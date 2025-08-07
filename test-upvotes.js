const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function testUpvotes() {
  try {
    // First, let's see what tickets exist
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        upvotes: true,
        downvotes: true,
        _count: {
          select: {
            votes: true
          }
        }
      },
      take: 5
    });

    console.log('Current tickets with vote counts:');
    tickets.forEach(ticket => {
      console.log(`${ticket.subject}: ${ticket.upvotes} upvotes, ${ticket.downvotes} downvotes, ${ticket._count.votes} vote records`);
    });

    // Add some sample upvotes to the first few tickets
    if (tickets.length > 0) {
      console.log('\nAdding sample upvotes...');
      
      for (let i = 0; i < Math.min(3, tickets.length); i++) {
        const ticket = tickets[i];
        const upvoteCount = Math.floor(Math.random() * 20) + 1;
        
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            upvotes: upvoteCount,
            downvotes: Math.floor(Math.random() * 5)
          }
        });
        
        console.log(`Updated ${ticket.subject} with ${upvoteCount} upvotes`);
      }
    }

    // Test the sorting query
    console.log('\nTesting sort by upvotes...');
    const sortedTickets = await prisma.ticket.findMany({
      orderBy: [
        { upvotes: 'desc' },
        { downvotes: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        subject: true,
        upvotes: true,
        downvotes: true,
        createdAt: true
      },
      take: 5
    });

    console.log('Tickets sorted by upvotes:');
    sortedTickets.forEach(ticket => {
      console.log(`${ticket.subject}: ${ticket.upvotes} upvotes, ${ticket.downvotes} downvotes`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpvotes();
