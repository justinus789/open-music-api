const routes = (handler) => [
  {
    method: 'POST',
    path: '/collaborations',
    handler: (reqeust, h) => handler.postCollaborationHandler(reqeust, h),
    options: {
      auth: 'openmusicapp_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/collaborations',
    handler: (reqeust) => handler.deleteCollaborationHandler(reqeust),
    options: {
      auth: 'openmusicapp_jwt',
    },
  },
];

module.exports = routes;
