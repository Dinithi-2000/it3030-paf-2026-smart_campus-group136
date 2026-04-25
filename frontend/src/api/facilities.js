import client from "./client";

function normalizeParams(filters = {}) {
  const params = {};

  if (filters.type && filters.type !== "ALL") params.type = filters.type;
  if (filters.status && filters.status !== "ALL") params.status = filters.status;
  if (filters.location?.trim()) params.location = filters.location.trim();
  if (filters.query?.trim()) params.query = filters.query.trim();
  if (filters.minCapacity !== "" && filters.minCapacity != null) params.minCapacity = Number(filters.minCapacity);
  if (filters.maxCapacity !== "" && filters.maxCapacity != null) params.maxCapacity = Number(filters.maxCapacity);

  return params;
}

export async function fetchFacilities(filters = {}) {
  const response = await client.get("/facilities", {
    params: normalizeParams(filters)
  });
  return response.data || [];
}

export async function createFacility(payload) {
  const response = await client.post("/facilities", payload);
  return response.data;
}

export async function updateFacility(id, payload) {
  const response = await client.put(`/facilities/${id}`, payload);
  return response.data;
}

export async function updateFacilityStatus(id, status) {
  const response = await client.patch(`/facilities/${id}/status`, { status });
  return response.data;
}

export async function deleteFacility(id) {
  await client.delete(`/facilities/${id}`);
}
