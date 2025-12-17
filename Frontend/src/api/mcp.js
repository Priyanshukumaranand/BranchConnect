const MCP_API_BASE_URL = process.env.REACT_APP_MCP_API_BASE_URL
  || 'https://mcp-resume-api.lemonglacier-3904d7f4.southeastasia.azurecontainerapps.io';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const parseMcpResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const error = new Error((payload && payload.message) || response.statusText || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const mcpFetch = async (path, options = {}) => {
  const { headers = {}, body, method = 'GET', skipJson = false, ...rest } = options;
  const init = {
    method,
    headers: {
      ...defaultHeaders,
      ...headers
    },
    ...rest
  };

  if (body !== undefined) {
    init.body = skipJson ? body : JSON.stringify(body);
  }

  if (skipJson || body instanceof FormData) {
    delete init.headers['Content-Type'];
  }

  const response = await fetch(`${MCP_API_BASE_URL}${path}`, init);
  return parseMcpResponse(response);
};

export const fetchMcpHealth = ({ signal } = {}) =>
  mcpFetch('/health', { method: 'GET', signal });

export const askPlacementQuestion = ({ question, topK = 3, signal }) =>
  mcpFetch('/qa', {
    method: 'POST',
    body: {
      question,
      top_k: topK
    },
    signal
  });

export const recommendTeammate = ({ role, skills = [], summary = '', topK = 5, signal }) =>
  mcpFetch('/recommend', {
    method: 'POST',
    body: {
      role,
      skills,
      summary,
      top_k: topK
    },
    signal
  });

export const listResumes = ({ signal } = {}) =>
  mcpFetch('/resumes', { method: 'GET', signal });

export const addResume = ({ resume, signal }) =>
  mcpFetch('/add_resume', {
    method: 'POST',
    body: resume,
    signal
  });

export const deleteResume = ({ resumeId, signal }) =>
  mcpFetch(`/resumes/${encodeURIComponent(resumeId)}`, {
    method: 'DELETE',
    signal
  });

export const addResumeFromPdf = ({ file, name, email, experience, role = '', skills = '', summary = '', signal }) => {
  const formData = new FormData();
  formData.append('file', file);

  // The API only requires the file; extra fields are attached when provided for richer context.
  if (name) formData.append('name', name);
  if (email) formData.append('email', email);
  if (experience) formData.append('experience', experience);
  if (role) formData.append('role', role);
  if (skills) formData.append('skills', skills);
  if (summary) formData.append('summary', summary);

  return mcpFetch('/ingest_pdf', {
    method: 'POST',
    body: formData,
    skipJson: true,
    signal
  });
};

export { MCP_API_BASE_URL };
