class ExportsHandler {
  constructor(ProducerService, playlistsService, validator) {
    this.ProducerService = ProducerService;
    this.playlistsService = playlistsService;
    this.validator = validator;
  }

  async postExportPlaylistsHandler(request, h) {
    this.validator.validateExportPlaylistsPayload(request.payload);
    const { targetEmail } = request.payload;
    const { playlistId } = request.params;
    const userId = request.auth.credentials.id;

    await this.playlistsService.verifyPlaylistAccess(playlistId, userId);

    const message = {
      playlistId,
      userId,
      targetEmail,
    };

    await this.ProducerService.sendMessage(
      'export:playlists',
      JSON.stringify(message),
    );

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
