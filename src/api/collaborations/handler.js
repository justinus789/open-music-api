class CollaborationsHandler {
  constructor(collaborationsService, playlistsService) {
    this.collaborationsService = collaborationsService;
    this.playlistsService = playlistsService;
  }

  async postCollaborationHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this.collaborationsService.verifyUser(userId);
    await this.playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    const collaborationId = await this.collaborationsService.addCollaboration(
      playlistId,
      userId,
    );

    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil ditambahkan',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this.playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this.collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
