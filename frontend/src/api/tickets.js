import client from "./client";

const MOCK_KEY = "smartcampus.mockTickets.v1";

function nowIso() {
  return new Date().toISOString();
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function currentActor() {
  const user = safeParse(localStorage.getItem("user"), null);
  const roles = safeParse(localStorage.getItem("roles"), []);

  const userId = user?.id || user?.username || "student001";
  const userName = user?.displayName || user?.username || "Campus User";
  const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : "USER";

  return { userId, userName, role };
}

function actorHeaders() {
  const { userId, userName, role } = currentActor();
  return {
    "X-User-Id": userId,
    "X-User-Name": userName,
    "X-User-Role": role
  };
}

function seedTickets() {
  const { userId, userName } = currentActor();
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
      closedAt: null,
      firstResponseAt: null,
      resolvedAt: null,
      timeToFirstResponseMinutes: null,
      timeToResolutionMinutes: null
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
      closedAt: null,
      firstResponseAt: null,
      resolvedAt: null,
      timeToFirstResponseMinutes: null,
      timeToResolutionMinutes: null
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

function mergeById(primary, secondary) {
  const merged = [...primary];
  const existingIds = new Set(primary.map((ticket) => ticket.id));
  for (const ticket of secondary) {
    if (!existingIds.has(ticket.id)) {
      merged.push(ticket);
    }
  }
  return merged;
}

function filterUserTickets(tickets) {
  const { userId, role } = currentActor();

  // Admin and Technician see all tickets
  if (role === "ADMIN" || role === "TECHNICIAN") {
    return [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Regular users see only their own tickets
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
    const response = await client.get("/tickets", {
      params: filters,
      headers: actorHeaders()
    });
    const serverTickets = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const localTickets = filterUserTickets(readMockTickets());
    return mergeById(serverTickets, localTickets).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return filterUserTickets(readMockTickets());
  }
}

/** Fetch all users with TECHNICIAN role from the backend. */
export async function fetchTechnicians() {
  const SEED_TECHS = [
    { id: "tech", username: "tech", displayName: "Tech User", email: "tech@smartcampus.local" }
  ];
  try {
    const response = await client.get("/users", {
      params: { role: "TECHNICIAN" },
      headers: actorHeaders()
    });
    const data = response.data || [];
    // Merge DB techs with seed tech (deduplicate by username)
    const dbUsernames = new Set(data.map(u => u.username));
    const extras = SEED_TECHS.filter(s => !dbUsernames.has(s.username));
    return [...data, ...extras];
  } catch {
    return SEED_TECHS;
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
      headers: actorHeaders()
    });

    // Remove any local fallback ticket that matches this freshly created ticket details.
    const current = readMockTickets();
    const cleaned = current.filter(
      (ticket) =>
        !(
          ticket.resourceId === response.data?.resourceId &&
          ticket.description === response.data?.description &&
          ticket.location === response.data?.location
        )
    );
    writeMockTickets(cleaned);

    return response.data;
  } catch {
    const { userId, userName } = currentActor();
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
      closedAt: null,
      firstResponseAt: null,
      resolvedAt: null,
      timeToFirstResponseMinutes: null,
      timeToResolutionMinutes: null
    };

    writeMockTickets([created, ...existing]);
    return created;
  }
}

export async function addComment(ticketId, content) {
  try {
    const response = await client.post(
      `/tickets/${ticketId}/comments`,
      { content },
      { headers: actorHeaders() }
    );
    return response.data;
  } catch {
    const { userId, userName, role } = currentActor();
    const tickets = readMockTickets();
    const updated = tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }
      const comment = {
        id: makeCommentId(),
        authorId: userId,
        authorName: userName,
        authorRole: role,
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
    return updated.find((ticket) => ticket.id === ticketId);
  }
}

export async function updateComment(ticketId, commentId, content) {
  try {
    const response = await client.patch(
      `/tickets/${ticketId}/comments/${commentId}`,
      { content },
      { headers: actorHeaders() }
    );
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
    return updated.find((ticket) => ticket.id === ticketId);
  }
}

export async function deleteComment(ticketId, commentId) {
  try {
    await client.delete(`/tickets/${ticketId}/comments/${commentId}`, {
      headers: actorHeaders()
    });
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
    return updated.find((ticket) => ticket.id === ticketId);
  }

  return null;
}

export async function assignTechnician(ticketId, body) {
  if (String(ticketId).startsWith("TK-")) {
    throw new Error("This ticket is stored locally and cannot be assigned on the server. Please wait for synchronization.");
  }
  const response = await client.put(`/tickets/${ticketId}/assignment`, body, {
    headers: actorHeaders()
  });
  return response.data;
}

export async function updateTicketStatus(ticketId, body) {
  if (String(ticketId).startsWith("TK-")) {
    throw new Error("This ticket is stored locally and cannot be updated on the server. Please wait for synchronization.");
  }
  const response = await client.patch(`/tickets/${ticketId}/status`, body, {
    headers: actorHeaders()
  });
  return response.data;
}
