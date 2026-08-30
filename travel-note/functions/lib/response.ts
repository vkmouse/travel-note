export function jsonOk(data: unknown, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, init)
}

export function jsonError(message: string, status = 500) {
  return Response.json({ success: false, error: message }, { status })
}
