class PlaylistsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;
  }

  async postPlaylistHandler(request, h) {
    this.validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this.service.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this.service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this.service.verifyPlaylistOwner(id, credentialId);
    await this.service.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postPlaylistSongByIdHandler(request, h) {
    this.validator.validatePlaylistSongPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;
    const { songId } = request.payload;

    await this.service.verifyPlaylistAccess(id, credentialId);
    await this.service.addPlaylistSongById({
      playlistId: id,
      songId,
      userId: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist Lagu berhasil ditambahkan',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    const playlist = await this.service.getPlaylistById(id, credentialId);
    playlist.songs = await this.service.getPlaylistSongsById(id);
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongByIdHandler(request) {
    this.validator.validatePlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    await this.service.deletePlaylistSongById(id, songId, credentialId);

    return {
      status: 'success',
      message: 'Playlist Lagu berhasil dihapus',
    };
  }

  async getPlaylistSongActivitiesByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    const activities = await this.service.getPlaylistSongActivitiesById(id);
    const data = {
      playlistId: id,
      activities,
    };
    return {
      status: 'success',
      data,
    };
  }
}

module.exports = PlaylistsHandler;
