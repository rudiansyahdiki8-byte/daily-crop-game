/* eslint-disable no-undef */
export const sendSuccess = (res, data, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, statusCode, message, errorDetails = null) => {
  console.error(`[API ERROR] ${message}:`, errorDetails);
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? errorDetails : undefined
  });
};

export const allowMethod = (req, res, method = 'POST') => {
  if (req.method !== method) {
    res.setHeader('Allow', [method]);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`
    });
    return false;
  }
  return true;
};