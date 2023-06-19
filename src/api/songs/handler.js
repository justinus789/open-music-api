class SongsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;
  }

  async postSongHandler(request, h) {
    this.validator.validateSongPayload(request.payload);
    const { title, performer, year, genre, duration, albumId } = request.payload;

    const songId = await this.service.addSong({
      title,
      performer,
      year,
      genre,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;
    const songs = await this.service.getSongs({ title, performer });
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;
    const { isCache, song } = await this.service.getSongById(id);
    const response = h.response({
      status: 'success',
      data: {
        song,
      },
    });
    response.code(200);

    if (isCache) response.header('X-Data-Source', 'cache');

    return response;
  }

  async putSongByIdHandler(request) {
    this.validator.validateSongPayload(request.payload);
    const { id } = request.params;

    await this.service.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    await this.service.deleteSongById(id);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongsHandler;
