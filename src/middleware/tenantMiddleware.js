const requireTenant = (req, res, next) => {
  // We assume authMiddleware has already run and populated req.user
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ error: 'Forbidden: Tenant ID is required' });
  }
  
  // Attach tenantId to the request for easy access in controllers
  req.tenantId = req.user.tenantId;
  next();
};

module.exports = { requireTenant };
