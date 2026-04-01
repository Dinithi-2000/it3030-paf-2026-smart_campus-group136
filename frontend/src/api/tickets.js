import client from "./client";

const MOCK_KEY = "smartcampus.mockTickets.v1";

function nowIso() {
  return new Date().toISOString();
}

function currentUser() {
  const userId = localStorage.getItem("smartcampus.userId") || "student001";
  const userName = localStorage.getItem("smartcampus.userName") || "Google User";
  return { userId, userName };
}

function seedTickets() {
  const { userId, userName } = currentUser();
  return [
    {
      id: "TK-1001",
      resourceId: "LAB-402",
      location: "Computing Lab 402",
      category: "Projector Fault",
      description: "Projector display flickers and turns off after 5 minutes.",
      priority: "HIGH",
      preferredContact: "user@sliit.lk",
      status: "OPEN",
      rejectionReason: null,
      resolutionNotes: null,
      createdByUserId: userId,
      createdByName: userName,
      assignedTechnicianId: null,
      assignedTechnicianName: null,
      attachments: [],
      comments: [
        {
          id: "CM-1",
          authorId: userId,
          authorName: userName,
          authorRole: "USER",
          content: "Issue started today morning during lecture.",
          createdAt: nowIso(),
          updatedAt: nowIso()
        }
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      closedAt: null
    },
    {
      id: "TK-1002",
      resourceId: "HALL-2",
      location: "Seminar Hall 2",
      category: "Air Conditioning",
      description: "AC is not cooling. Room temperature is too high for sessions.",
      priority: "MEDIUM",
      preferredContact: "+94 77 000 0000",
      status: "IN_PROGRESS",
      rejectionReason: null,
      resolutionNotes: null,
      createdByUserId: userId,
      createdByName: userName,
      assignedTechnicianId: "tech007",
      assignedTechnicianName: "Tech Operator",
      attachments: [],
      comments: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      closedAt: null
    }
  ];
}

function readMockTickets() {
  const raw = localStorage.getItem(MOCK_KEY);
  if (!raw) {
    const seeded = seedTickets();
    localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const seeded = seedTickets();
      localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = seedTickets();
    localStorage.setItem(MOCK_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeMockTickets(tickets) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(tickets));
}

function filterUserTickets(tickets) {
  const { userId } = currentUser();
  return tickets
    .filter((ticket) => ticket.createdByUserId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function makeTicketId() {
  return `TK-${Date.now()}`;
}

function makeCommentId() {
  return `CM-${Date.now()}`;
}

export async function fetchTickets(filters = {}) {
  try {
    const response = await client.get("/tickets", { params: filters });
    return filterUserTickets(response.data || []);
  } catch {
    return filterUserTickets(readMockTickets());
  }
}

export async function createTicket(payload) {
  const formData = new FormData();
  formData.append("resourceId", payload.resourceId);
  formData.append("location", payload.location);
  formData.append("category", payload.category);
  formData.append("description", payload.description);
  formData.append("priority", payload.priority);
  formData.append("preferredContact", payload.preferredContact);

  (payload.attachments || []).forEach((file) => {
    formData.append("attachments", file);
  });

  try {
    const response = await client.post("/tickets", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  } catch {
    const { userId, userName } = currentUser();
    const existing = readMockTickets();
    const created = {
      id: makeTicketId(),
      resourceId: payload.resourceId,
      location: payload.location,
      category: payload.category,
      description: payload.description,
      priority: payload.priority,
      preferredContact: payload.preferredContact,
      status: "OPEN",
      rejectionReason: null,
      resolutionNotes: null,
      createdByUserId: userId,
      createdByName: userName,
      assignedTechnicianId: null,
      assignedTechnicianName: null,
      attachments: (payload.attachments || []).map((file) => ({
        id: makeCommentId(),
        fileName: file.name,
        contentType: file.type,
        size: file.size
      })),
      comments: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      closedAt: null
    };

    writeMockTickets([created, ...existing]);
    return created;
  }
}

export async function addComment(ticketId, content) {
  try {
    const response = await client.post(`/tickets/${ticketId}/comments`, { content });
    return response.data;
  } catch {
    const { userId, userName } = currentUser();
    const tickets = readMockTickets();
    const updated = tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }
      const comment = {
        id: makeCommentId(),
        authorId: userId,
        authorName: userName,
        authorRole: "USER",
        content,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      return {
        ...ticket,
        comments: [...(ticket.comments || []), comment],
        updatedAt: nowIso()
      };
    });
    writeMockTickets(updated);
  }
}

export async function updateComment(ticketId, commentId, content) {
  try {
    const response = await client.patch(`/tickets/${ticketId}/comments/${commentId}`, { content });
    return response.data;
  } catch {
    const tickets = readMockTickets();
    const updated = tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }
      const comments = (ticket.comments || []).map((comment) =>
        comment.id === commentId ? { ...comment, content, updatedAt: nowIso() } : comment
      );
      return { ...ticket, comments, updatedAt: nowIso() };
    });
    writeMockTickets(updated);
  }
}

export async function deleteComment(ticketId, commentId) {
  try {
    await client.delete(`/tickets/${ticketId}/comments/${commentId}`);
  } catch {
    const tickets = readMockTickets();
    const updated = tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }
      const comments = (ticket.comments || []).filter((comment) => comment.id !== commentId);
      return { ...ticket, comments, updatedAt: nowIso() };
    });
    writeMockTickets(updated);
  }
}

export async function assignTechnician(ticketId, body) {
  const response = await client.put(`/tickets/${ticketId}/assignment`, body);
  return response.data;
}

export async function updateTicketStatus(ticketId, body) {
  const response = await client.patch(`/tickets/${ticketId}/status`, body);
  return response.data;
}
